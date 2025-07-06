/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
import { EventEmitter } from 'events';
import Imap from 'node-imap';
import { simpleParser, ParsedMail } from 'mailparser';
import {
	Mail,
	MailFolder,
	// MailAccount, // Not used in this file
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

	private readonly accountId: string;

	private isConnected: boolean = false;

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
			const fullPath = parent ? `${parent}${box.delimiter}${name}` : name;

			const folder: MailFolder = {
				id: fullPath, // Use the full path as a stable ID
				accountId: this.accountId,
				name,
				path: fullPath,
				type: ImapClient.getFolderType(name, box),
				// NOTE: The getBoxes() method does not provide message counts.
				// This information must be fetched with openFolder() or status() for
				// a specific folder.
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
				this.parseBoxes(box.children, fullPath, folders);
			}
		});

		return folders;
	}

	private static getFolderType(name: string, box: any): MailFolder['type'] {
		const lowerName = name.toLowerCase();

		// Check for special-use attributes first (RFC 6154)
		if (box.attribs) {
			if (box.attribs.includes('\\Inbox')) return 'inbox';
			if (box.attribs.includes('\\Sent')) return 'sent';
			if (box.attribs.includes('\\Drafts')) return 'drafts';
			if (box.attribs.includes('\\Trash')) return 'trash';
			if (box.attribs.includes('\\Junk')) return 'spam';
			if (box.attribs.includes('\\Archive')) return 'archive';
			if (box.attribs.includes('\\All')) return 'all';
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
		await this.openFolder(folderPath, true);

		return new Promise((resolve, reject) => {
			if (!this.imap) {
				reject(new Error('Not connected'));
				return;
			}

			// Build search criteria
			const searchCriteria =
				options.searchCriteria ||
				(options.since ? ['SINCE', options.since] : ['ALL']);

			this.imap.search(searchCriteria, (err, uids: number[]) => {
				if (err) {
					reject(err);
					return;
				}

				if (uids.length === 0) {
					resolve([]);
					return;
				}

				// Apply pagination
				const uidsToFetch = ImapClient.paginateUids(
					uids,
					options.limit,
					options.offset,
				);

				const mails: Mail[] = [];
				if (uidsToFetch.length === 0) {
					resolve(mails);
					return;
				}

				const fetch = this.imap!.fetch(uidsToFetch, {
					bodies: '',
					struct: true,
				});

				fetch.on('message', (msg) => {
					let attributes: any;
					const chunks: Buffer[] = [];

					msg.once('attributes', (attrs) => {
						attributes = attrs;
					});

					msg.on('body', (stream) => {
						stream.on('data', (chunk) => {
							chunks.push(chunk as Buffer);
						});
						stream.once('end', async () => {
							const rawMailBuffer = Buffer.concat(chunks);
							try {
								const parsed = await simpleParser(rawMailBuffer);
								const mail = this.convertParsedMail(
									parsed,
									attributes,
									folderPath,
									rawMailBuffer.toString('utf-8'),
								);
								mails.push(mail);
							} catch (error) {
								// Log parsing errors but don't reject the whole batch
								console.error(
									`Error parsing mail UID ${attributes.uid}:`,
									error,
								);
							}
						});
					});
				});

				fetch.once('error', reject);
				fetch.once('end', () => {
					// Sort mails by UID descending (most recent first)
					mails.sort((a, b) => (b.uid || 0) - (a.uid || 0));
					resolve(mails);
				});
			});
		});
	}

	private convertParsedMail(
		parsed: ParsedMail,
		attrs: { uid: number; flags: string[]; date: Date; size: number },
		folderPath: string,
		raw: string,
	): Mail {
		const mail: Mail = {
			id: `${this.accountId}:${folderPath}:${attrs.uid}`, // Stable ID
			uid: attrs.uid,
			accountId: this.accountId,
			messageId: parsed.messageId || '',
			threadId:
				parsed.inReplyTo || parsed.references?.[0] || parsed.messageId || '',
			folderId: folderPath,
			subject: parsed.subject || '(No Subject)',
			from: ImapClient.parseAddresses(parsed.from),
			to: ImapClient.parseAddresses(parsed.to),
			cc: ImapClient.parseAddresses(parsed.cc),
			bcc: ImapClient.parseAddresses(parsed.bcc),
			replyTo: ImapClient.parseAddresses(parsed.replyTo),
			date: parsed.date || new Date(),
			receivedDate: attrs.date || new Date(),
			htmlBody: typeof parsed.html === 'string' ? parsed.html : '',
			textBody: parsed.text || parsed.textAsHtml || '',
			snippet: ImapClient.generateSnippet(parsed.text || parsed.html || ''),
			attachments: ImapClient.parseAttachments(parsed.attachments),
			labels: [],
			isRead: attrs.flags?.includes('\\Seen') || false,
			isFlagged: attrs.flags?.includes('\\Flagged') || false,
			isImportant: false,
			isDraft: attrs.flags?.includes('\\Draft') || false,
			isDeleted: attrs.flags?.includes('\\Deleted') || false,
			hasAttachments: (parsed.attachments?.length || 0) > 0,
			size: attrs.size || 0,
			headers: ImapClient.parseHeaders(parsed.headers),
			raw,
		};

		return mail;
	}

	private static parseAddresses(
		addresses?: ParsedMail['from'] | ParsedMail['to'],
	): MailAddress[] {
		if (!addresses) return [];

		const addressArray = 'value' in addresses ? addresses.value : addresses;
		const result: MailAddress[] = [];

		addressArray.forEach((addr) => {
			if ('address' in addr && addr.address) {
				result.push({ name: addr.name, address: addr.address });
			} else if ('group' in addr) {
				result.push(...ImapClient.parseAddresses(addr.group));
			}
		});
		return result;
	}

	private static parseAttachments(
		attachments?: ParsedMail['attachments'],
	): MailAttachment[] {
		if (!attachments) return [];

		return attachments.map((att) => ({
			id: att.checksum || att.contentId || att.filename || 'unknown-attachment',
			filename: att.filename || 'attachment',
			contentType: att.contentType || 'application/octet-stream',
			size: att.size || 0,
			contentId: att.contentId,
			contentDisposition: att.contentDisposition,
			content: att.content,
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
		if (!content) return '';
		// Remove HTML tags
		const text = content.replace(/<[^>]*>/g, '');
		// Remove extra whitespace
		const cleaned = text.replace(/\s+/g, ' ').trim();
		// Return first 200 characters
		return cleaned.substring(0, 200);
	}

	private static paginateUids(
		uids: number[],
		limit?: number,
		offset?: number,
	): number[] {
		const start = offset || 0;
		const end = limit ? start + limit : uids.length;
		return uids.slice(start, end);
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

	async markAsFlagged(uid: number, flagged = true): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.imap) {
				reject(new Error('Not connected'));
				return;
			}

			const flag = flagged ? '\\Flagged' : '-\\Flagged';
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
					this.imap!.expunge((expungeErr) => {
						if (expungeErr) reject(expungeErr);
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
		await this.openFolder(folder.path, true);

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
	} finally {
		client.disconnect();
	}
};
