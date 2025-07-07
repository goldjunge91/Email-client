import type { MailAccount, MailFolder, Mail } from '@/types/mail';
/**
 * Renderer-seitiger Mail-Service, der per IPC mit dem Main-Prozess kommuniziert.
 *
 * Gegenstellen:
 *   - Main-Prozess: IPC-Handler in {@link ../../main/ipc/mail-ipc.ts} (führt die eigentliche Mail-Logik aus)
 *   - Typen: {@link @/types/mail} (gemeinsame Typdefinitionen)
 *
 * Funktion:
 *   Bietet Methoden für alle Mail-bezogenen Operationen (Accounts, Ordner, Mails, Sync) im Renderer-Prozess. Die Methoden rufen per IPC die jeweiligen Handler im Main-Prozess auf und geben die Ergebnisse zurück.
 *
 * Öffentliche Methoden:
 *
 *   createAccount(account: Omit<MailAccount, 'id' | 'created_at' | 'updated_at'>): Promise<MailAccount>
 *     Erstellt ein neues Mail-Konto.
 *     @param account   Account-Objekt ohne id, created_at, updated_at
 *     @returns         Das angelegte MailAccount-Objekt
 *
 *   getAccountsByUserId(userId: number): Promise<MailAccount[]>
 *     Holt alle Accounts eines Users.
 *     @param userId    User-ID
 *     @returns         Array von MailAccount
 *
 *   getAccountById(id: number): Promise<MailAccount | null>
 *     Holt einen Account anhand der ID.
 *     @param id        Account-ID
 *     @returns         MailAccount oder null
 *
 *   updateAccount(id: number, updates: Partial<MailAccount>): Promise<MailAccount>
 *     Aktualisiert einen Account.
 *     @param id        Account-ID
 *     @param updates   Teil-Objekt mit zu ändernden Feldern
 *     @returns         Aktualisiertes MailAccount-Objekt
 *
 *   deleteAccount(id: number): Promise<void>
 *     Löscht einen Account.
 *     @param id        Account-ID
 *
 *   getFoldersByAccount(accountId: number): Promise<MailFolder[]>
 *     Holt alle Ordner eines Accounts.
 *     @param accountId Account-ID
 *     @returns         Array von MailFolder
 *
 *   getMailsByFolder(folderId: number, limit?: number, offset?: number): Promise<Mail[]>
 *     Holt Mails eines Ordners (paginierbar).
 *     @param folderId  Ordner-ID
 *     @param limit     Max. Anzahl (default 50)
 *     @param offset    Offset (default 0)
 *     @returns         Array von Mail
 *
 *   getMailById(id: number): Promise<Mail | null>
 *     Holt eine Mail anhand der ID.
 *     @param id        Mail-ID
 *     @returns         Mail-Objekt oder null
 *
 *   markMailAsRead(id: number): Promise<void>
 *     Markiert eine Mail als gelesen.
 *     @param id        Mail-ID
 *
 *   markMailAsUnread(id: number): Promise<void>
 *     Markiert eine Mail als ungelesen.
 *     @param id        Mail-ID
 *
 *   flagMail(id: number): Promise<void>
 *     Markiert eine Mail als "geflaggt".
 *     @param id        Mail-ID
 *
 *   unflagMail(id: number): Promise<void>
 *     Entfernt das "Flag" von einer Mail.
 *     @param id        Mail-ID
 *
 *   deleteMail(id: number): Promise<void>
 *     Löscht eine Mail.
 *     @param id        Mail-ID
 *
 *   searchMails(accountId: number, query: string, limit?: number): Promise<Mail[]>
 *     Sucht Mails nach Query.
 *     @param accountId Account-ID
 *     @param query     Suchbegriff
 *     @param limit     Max. Anzahl (default 50)
 *     @returns         Array von Mail
 *
 *   syncAccount(accountId: number): Promise<void>
 *     Synchronisiert einen Account.
 *     @param accountId Account-ID
 */

// Renderer-side mail service that communicates with main process via IPC
// Types without database imports
// interface MailAccount {
// 	id: number;
// 	user_id: number;
// 	email: string;
// 	password: string;
// 	display_name: string;
// 	imap_host: string;
// 	imap_port: number;
// 	imap_security: 'none' | 'tls' | 'ssl';
// 	smtp_host: string;
// 	smtp_port: number;
// 	smtp_security: 'none' | 'tls' | 'ssl';
// 	is_active: boolean;
// 	created_at: Date;
// 	updated_at: Date;
// }

// interface MailFolder {
// 	id: number;
// 	account_id: number;
// 	name: string;
// 	full_name: string;
// 	folder_type: 'inbox' | 'sent' | 'draft' | 'trash' | 'spam' | 'custom';
// 	unread_count: number;
// 	total_count: number;
// 	created_at: Date;
// 	updated_at: Date;
// }

// interface Mail {
// 	id: number;
// 	account_id: number;
// 	folder_id: number;
// 	message_id: string;
// 	subject: string;
// 	from: any;
// 	to: any;
// 	cc?: any;
// 	bcc?: any;
// 	date: Date;
// 	body_html?: string;
// 	body_text?: string;
// 	text_content?: string;
// 	attachments?: any;
// 	is_read: boolean;
// 	is_flagged: boolean;
// 	is_deleted: boolean;
// 	uid: number;
// 	created_at: Date;
// 	updated_at: Date;
// }

export class MailService {
	// Account Management
	static async createAccount(
		account: Omit<MailAccount, 'id' | 'created_at' | 'updated_at'>,
	): Promise<MailAccount> {
		const result = await window.electron.invoke('mail:create-account', account);
		if (result.success) {
			return result.account;
		}
		throw new Error(result.error || 'Failed to create account');
	}

	static async getAccountsByUserId(userId: number): Promise<MailAccount[]> {
		const result = await window.electron.invoke(
			'mail:get-accounts-by-user',
			userId,
		);
		if (result.success) {
			return result.accounts;
		}
		throw new Error(result.error || 'Failed to get accounts');
	}

	static async getAccountById(id: number): Promise<MailAccount | null> {
		const result = await window.electron.invoke('mail:get-account-by-id', id);
		if (result.success) {
			return result.account;
		}
		throw new Error(result.error || 'Failed to get account');
	}

	static async updateAccount(
		id: number,
		updates: Partial<MailAccount>,
	): Promise<MailAccount> {
		const result = await window.electron.invoke('mail:update-account', {
			id,
			updates,
		});
		if (result.success) {
			return result.account;
		}
		throw new Error(result.error || 'Failed to update account');
	}

	static async deleteAccount(id: number): Promise<void> {
		const result = await window.electron.invoke('mail:delete-account', id);
		if (!result.success) {
			throw new Error(result.error || 'Failed to delete account');
		}
	}

	// Folder Management
	static async getFoldersByAccount(accountId: number): Promise<MailFolder[]> {
		const result = await window.electron.invoke(
			'mail:get-folders-by-account',
			accountId,
		);
		if (result.success) {
			return result.folders;
		}
		throw new Error(result.error || 'Failed to get folders');
	}

	// Mail Management
	static async getMailsByFolder(
		folderId: number,
		limit = 50,
		offset = 0,
	): Promise<Mail[]> {
		const result = await window.electron.invoke('mail:get-mails-by-folder', {
			folderId,
			limit,
			offset,
		});
		if (result.success) {
			return result.mails;
		}
		throw new Error(result.error || 'Failed to get mails');
	}

	static async getMailById(id: number): Promise<Mail | null> {
		const result = await window.electron.invoke('mail:get-mail-by-id', id);
		if (result.success) {
			return result.mail;
		}
		throw new Error(result.error || 'Failed to get mail');
	}

	static async markMailAsRead(id: number): Promise<void> {
		const result = await window.electron.invoke('mail:mark-as-read', id);
		if (!result.success) {
			throw new Error(result.error || 'Failed to mark mail as read');
		}
	}

	static async markMailAsUnread(id: number): Promise<void> {
		const result = await window.electron.invoke('mail:mark-as-unread', id);
		if (!result.success) {
			throw new Error(result.error || 'Failed to mark mail as unread');
		}
	}

	static async flagMail(id: number): Promise<void> {
		const result = await window.electron.invoke('mail:flag-mail', id);
		if (!result.success) {
			throw new Error(result.error || 'Failed to flag mail');
		}
	}

	static async unflagMail(id: number): Promise<void> {
		const result = await window.electron.invoke('mail:unflag-mail', id);
		if (!result.success) {
			throw new Error(result.error || 'Failed to unflag mail');
		}
	}

	static async deleteMail(id: number): Promise<void> {
		const result = await window.electron.invoke('mail:delete-mail', id);
		if (!result.success) {
			throw new Error(result.error || 'Failed to delete mail');
		}
	}

	static async searchMails(
		accountId: number,
		query: string,
		limit = 50,
	): Promise<Mail[]> {
		const result = await window.electron.invoke('mail:search-mails', {
			accountId,
			query,
			limit,
		});
		if (result.success) {
			return result.mails;
		}
		throw new Error(result.error || 'Failed to search mails');
	}

	// Sync operations
	static async syncAccount(accountId: number): Promise<void> {
		const result = await window.electron.invoke('mail:sync-account', accountId);
		if (!result.success) {
			throw new Error(result.error || 'Failed to sync account');
		}
	}
}

export const mailService = MailService;
export type { MailAccount, MailFolder, Mail };
