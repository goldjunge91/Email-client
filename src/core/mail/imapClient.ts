/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { EventEmitter } from 'events';
import Imap from 'node-imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { v4 as uuidv4 } from 'uuid';
import {
	Mail,
	MailFolder,
	MailAccount,
	MailAddress,
	MailAttachment,
} from '../../types/mail';

export interface ImapConnectionOptions {
	user: string;
	password: string;
	host: string;
	port: number;
	tls: boolean;
	authTimeout?: number;
	connTimeout?: number;
}

export class ImapClient extends EventEmitter {
	private imap: Imap | null = null;

	private accountId: string;

	private isConnected: boolean = false;

	private syncInProgress: boolean = false;

	constructor(accountId: string) {
		super();
		this.accountId = accountId;
	}

	// Connection Management
	async connect(options: ImapConnectionOptions): Promise<void> {
		return new Promise((resolve, reject) => {
			this.imap = new Imap({
				user: options.user,
				password: options.password,
				host: options.host,
				port: options.port,
				tls: options.tls,
				authTimeout: options.authTimeout || 10000,
				connTimeout: options.connTimeout || 10000,
				tlsOptions: {
					rejectUnauthorized: false,
					servername: options.host,
				},
			});

			this.imap.once('ready', () => {
				this.isConnected = true;
				this.emit('connected');
				resolve();
			});

			this.imap.once('error', (err: Error) => {
				this.isConnected = false;
				this.emit('error', err);
				reject(err);
			});

			this.imap.once('end', () => {
				this.isConnected = false;
				this.emit('disconnected');
			});

			this.imap.connect();
		});
	}

	disconnect(): void {
		if (this.imap && this.isConnected) {
			this.imap.end();
			this.imap = null;
			this.isConnected = false;
		}
	}

	// Folder Operations
	async getFolders(): Promise<MailFolder[]> {
		return new Promise((resolve, reject) => {
			if (!this.imap || !this.isConnected) {
				reject(new Error('Not connected to IMAP server'));
				return;
			}

			this.imap.getBoxes((err, boxes) => {
				if (err) {
					reject(err);
					return;
				}

				const folders = this.parseBoxes(boxes);
				resolve(folders);
			});
		});
	}

	private parseBoxes(
		boxes: any,
		parent = '',
		folders: MailFolder[] = [],
	): MailFolder[] {
		Object.entries<any>(boxes).forEach(([name, box]) => {
			const fullPath = parent ? `${parent}${box.delimiter}${name}` : name; // eslint-disable-line @typescript-eslint/no-shadow

			const folder: MailFolder = {
				id: uuidv4(),
				accountId: this.accountId,
				name, // eslint-disable-line @typescript-eslint/no-shadow
				path: fullPath,
				type: this.getFolderType(name, box),
				unreadCount: 0,
				totalCount: 0,
				syncState: {
					lastSync: null,
					highestModSeq: null,
					uidValidity: null,
					uidNext: null,
				},
			};

			folders.push(folder);

			// Recursively parse children
			if (box.children) {
				this.parseBoxes(box.children, fullPath, folders); // eslint-disable-line @typescript-eslint/no-shadow
			}
		});

		return folders;
	}

	private static getFolderType(name: string, box: any): MailFolder['type'] {
		const lowerName = name.toLowerCase();

		if (box.special_use_attrib) {
			if (box.special_use_attrib.includes('\\Inbox')) return 'inbox';
			if (box.special_use_attrib.includes('\\Sent')) return 'sent';
			if (box.special_use_attrib.includes('\\Drafts')) return 'drafts';
			if (box.special_use_attrib.includes('\\Trash')) return 'trash';
			if (box.special_use_attrib.includes('\\Junk')) return 'spam';
			if (box.special_use_attrib.includes('\\Archive')) return 'archive';
			if (box.special_use_attrib.includes('\\All')) return 'all';
		}

		// Fallback to name-based detection
		if (lowerName.includes('inbox')) return 'inbox';
		if (lowerName.includes('sent')) return 'sent';
		if (lowerName.includes('draft')) return 'drafts';
		if (lowerName.includes('trash') || lowerName.includes('deleted'))
			return 'trash';
		if (lowerName.includes('spam') || lowerName.includes('junk')) return 'spam';
		if (lowerName.includes('archive')) return 'archive';
		if (lowerName.includes('all mail')) return 'all';

		return 'custom';
	}

	// Mail Operations
	async openFolder(folderPath: string, readOnly = false): Promise<Imap.Box> {
		return new Promise((resolve, reject) => {
			if (!this.imap || !this.isConnected) {
				reject(new Error('Not connected to IMAP server'));
				return;
			}

			this.imap.openBox(folderPath, readOnly, (err, box) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(box);
			});
		});
	}

	async fetchMails(
		folderPath: string,
		options: {
			limit?: number;
			offset?: number;
			since?: Date;
			searchCriteria?: any[];
		} = {},
	): Promise<Mail[]> {
		const box = await this.openFolder(folderPath, true);

		return new Promise((resolve, reject) => {
			if (!this.imap) {
				reject(new Error('Not connected'));
				return;
			}

			// Build search criteria
			let searchCriteria = options.searchCriteria || ['ALL'];
			if (options.since) {
				searchCriteria = ['SINCE', options.since];
			}

			this.imap.search(searchCriteria, (err, uids) => {
				if (err) {
					reject(err);
					return;
				}

				if (uids.length === 0) {
					resolve([]);
					return;
				}

				// Apply pagination
				let fetchUids = uids;
				if (options.offset !== undefined || options.limit !== undefined) {
					const start = options.offset || 0;
					const end = options.limit ? start + options.limit : uids.length;
					fetchUids = uids.slice(start, end);
				}

				const mails: Mail[] = [];
				const fetch = this.imap!.fetch(fetchUids, {
					bodies: '',
					struct: true,
					envelope: true,
				});

				fetch.on('message', (msg, seqno) => {
					let rawMail = '';

					msg.on('body', (stream) => {
						stream.on('data', (chunk) => {
							rawMail += chunk.toString();
						});
					});

					msg.once('attributes', async (attrs) => {
						try {
							const parsed = await simpleParser(rawMail);
							const mail = this.convertParsedMail(parsed, attrs, folderPath);
							mails.push(mail);
						} catch (error) {
							console.error('Error parsing mail:', error);
						}
					});
				});

				fetch.once('error', reject);
				fetch.once('end', () => resolve(mails));
			});
		});
	}

	private convertParsedMail(
		parsed: ParsedMail,
		attrs: any,
		folderPath: string,
	): Mail {
		const mail: Mail = {
			id: uuidv4(),
			accountId: this.accountId,
			messageId: parsed.messageId || '',
			threadId: parsed.inReplyTo || parsed.messageId || '',
			folderId: folderPath,
			subject: parsed.subject || '(No Subject)',
			from: this.parseAddresses(parsed.from),
			to: this.parseAddresses(parsed.to),
			cc: this.parseAddresses(parsed.cc),
			bcc: this.parseAddresses(parsed.bcc),
			replyTo: this.parseAddresses(parsed.replyTo),
			date: parsed.date || new Date(),
			receivedDate: attrs.date || new Date(),
			htmlBody: parsed.html || '',
			textBody: parsed.text || '',
			snippet: this.generateSnippet(parsed.text || parsed.html || ''),
			attachments: this.parseAttachments(parsed.attachments),
			labels: [],
			isRead: attrs.flags?.includes('\\Seen') || false,
			isStarred: attrs.flags?.includes('\\Flagged') || false,
			isImportant: false,
			isDraft: attrs.flags?.includes('\\Draft') || false,
			isDeleted: attrs.flags?.includes('\\Deleted') || false,
			hasAttachments: (parsed.attachments?.length || 0) > 0,
			size: attrs.size || 0,
			headers: this.parseHeaders(parsed.headers),
			// eslint-disable-next-line no-undef
			raw: rawMail,
		};

		return mail;
	}

	private static parseAddresses(addresses?: ParsedMail['from']): MailAddress[] {
		if (!addresses) return [];

		const addressArray = Array.isArray(addresses) ? addresses : [addresses];

		return addressArray.map((addr) => ({
			name: addr.value?.[0]?.name ?? '',
			address: addr.value?.[0]?.address ?? '',
		}));
	}

	private static parseAttachments(
		attachments?: ParsedMail['attachments'],
	): MailAttachment[] {
		if (!attachments) return [];

		return attachments.map((att) => ({
			id: uuidv4(),
			filename: att.filename || 'attachment',
			contentType: att.contentType || 'application/octet-stream',
			size: att.size || 0,
			contentId: att.contentId,
			contentDisposition: att.contentDisposition,
			checksum: att.checksum,
			related: att.related || false,
		}));
	}

	private static parseHeaders(
		headers?: ParsedMail['headers'],
	): Record<string, string> {
		const result: Record<string, string> = {};

		if (headers && headers instanceof Map) {
			headers.forEach((value, key) => {
				result[key] = String(value);
			});
		}

		return result;
	}

	private static generateSnippet(content: string): string {
		// Remove HTML tags
		const text = content.replace(/<[^>]*>/g, '');
		// Remove extra whitespace
		const cleaned = text.replace(/\s+/g, ' ').trim();
		// Return first 200 characters
		return cleaned.substring(0, 200) + (cleaned.length > 200 ? '...' : '');
	}

	// Mail Actions
	async markAsRead(uid: number, read = true): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.imap) {
				reject(new Error('Not connected'));
				return;
			}

			const flag = read ? '\\Seen' : '-\\Seen';
			this.imap.addFlags(uid, flag, (err) => {
				if (err) reject(err);
				else resolve();
			});
		});
	}

	async markAsStarred(uid: number, starred = true): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.imap) {
				reject(new Error('Not connected'));
				return;
			}

			const flag = starred ? '\\Flagged' : '-\\Flagged';
			this.imap.addFlags(uid, flag, (err) => {
				if (err) reject(err);
				else resolve();
			});
		});
	}

	async moveMail(uid: number, targetFolder: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.imap) {
				reject(new Error('Not connected'));
				return;
			}

			this.imap.move(uid, targetFolder, (err) => {
				if (err) reject(err);
				else resolve();
			});
		});
	}

	async deleteMail(uid: number, expunge = false): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.imap) {
				reject(new Error('Not connected'));
				return;
			}

			this.imap.addFlags(uid, '\\Deleted', (err) => {
				if (err) {
					reject(err);
					return;
				}

				if (expunge) {
					this.imap!.expunge((err2: Error) => {
						if (err) reject(err);
						else resolve();
					});
				} else {
					resolve();
				}
			});
		});
	}

	// Search
	async searchMails(folderPath: string, criteria: any[]): Promise<number[]> {
		await this.openFolder(folderPath, true);

		return new Promise((resolve, reject) => {
			if (!this.imap) {
				reject(new Error('Not connected'));
				return;
			}

			this.imap.search(criteria, (err, uids) => {
				if (err) reject(err);
				else resolve(uids);
			});
		});
	}

	// Sync
	async syncFolder(folder: MailFolder): Promise<{
		newMails: Mail[];
		modifiedMails: Mail[];
		deletedUids: number[];
	}> {
		const box = await this.openFolder(folder.path, true);

		// This is a simplified sync implementation
		// In production, you'd want to use UIDVALIDITY, UIDNEXT, and MODSEQ
		const newMails = await this.fetchMails(folder.path, {
			since:
				folder.syncState.lastSync ||
				new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
		});

		return {
			newMails,
			modifiedMails: [],
			deletedUids: [],
		};
	}

	/**
	 * E-Mails mit Datenbank-Integration abrufen
	 */
	async fetchEmailsToDatabase(
		folderPath: string,
		folderId: number,
		sinceUid?: number,
		limit = 50,
	): Promise<Mail[]> {
		await this.openBox(folderPath);

		return new Promise((resolve, reject) => {
			if (!this.imap) {
				reject(new Error('IMAP-Verbindung nicht hergestellt'));
				return;
			}

			// Suchkriterien definieren
			let searchCriteria: (string | string[])[] = ['ALL'];
			if (sinceUid) {
				searchCriteria = [['UID', `${sinceUid}:*`]];
			}

			this.imap.search(searchCriteria, (err, results) => {
				if (err) {
					reject(err);
					return;
				}

				if (!results || results.length === 0) {
					resolve([]);
					return;
				}

				// Begrenzen auf die letzten N E-Mails
				const limitedResults = results.slice(-limit);

				const messages: Mail[] = [];
				const f = this.imap!.fetch(limitedResults, {
					bodies: '',
					struct: true,
					envelope: true,
				});

				f.on('message', (msg, seqno) => {
					let buffer = '';
					let envelope: any;
					let uid: number;

					msg.on('body', (stream) => {
						stream.on('data', (chunk) => {
							buffer += chunk.toString('utf8');
						});
					});

					msg.once('attributes', (attrs) => {
						envelope = attrs.envelope;
						uid = attrs.uid;
					});

					msg.once('end', async () => {
						try {
							// E-Mail parsen
							const parsed = await simpleParser(buffer);

							// Mail-Objekt erstellen
							const mail: Mail = {
								id: 0, // Wird von der Datenbank gesetzt
								account_id: parseInt(this.accountId, 10),
								folder_id: folderId,
								uid,
								message_id: parsed.messageId || '',
								thread_id: parsed.references?.[0] || null,
								subject: parsed.subject || '',
								from: this.parseAddresses(parsed.from),
								to: this.parseAddresses(parsed.to),
								cc: this.parseAddresses(parsed.cc),
								bcc: this.parseAddresses(parsed.bcc),
								reply_to: this.parseAddresses(parsed.replyTo),
								text_content: parsed.text || null,
								html_content: parsed.html || null,
								snippet: this.generateSnippet(parsed.text || parsed.html || ''),
								date: parsed.date || envelope.date || new Date(),
								received_date: new Date(),
								size: buffer.length,
								is_read: false,
								is_starred: false,
								is_flagged: false,
								is_answered: false,
								is_draft: false,
								is_deleted: false,
								has_attachments: (parsed.attachments?.length || 0) > 0,
								attachment_count: parsed.attachments?.length || 0,
								created_at: new Date(),
								updated_at: new Date(),
							};

							messages.push(mail);
						} catch (parseError) {
							console.error('Fehler beim Parsen der E-Mail:', parseError);
						}
					});
				});

				f.once('error', (fetchError) => {
					reject(fetchError);
				});

				f.once('end', () => {
					resolve(messages);
				});
			});
		});
	}

	/**
	 * Parse email addresses
	 */
	private static parseMailAddresses(addresses: any): any[] {
		if (!addresses) return [];

		if (Array.isArray(addresses)) {
			return addresses.map((addr) => ({
				name: addr.name || '',
				address: addr.address || '',
			}));
		}

		if (typeof addresses === 'object' && addresses.address) {
			return [
				{
					name: addresses.name || '',
					address: addresses.address,
				},
			];
		}

		return [];
	}

	// Utility
	isReady(): boolean {
		return this.isConnected;
	}

	getAccountId(): string {
		return this.accountId;
	}
}

// Export verification function for backward compatibility
export const verifyImapConnection = async (account: {
	username: string;
	password: string;
	server: string;
	port: number;
	ssl: boolean;
}): Promise<void> => {
	const client = new ImapClient('test');

	try {
		await client.connect({
			user: account.username,
			password: account.password,
			host: account.server,
			port: account.port,
			tls: account.ssl,
		});

		client.disconnect(); // Always disconnect after verification
	} finally {
		/* empty */
	}
};
