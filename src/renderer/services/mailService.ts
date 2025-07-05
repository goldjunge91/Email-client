// Renderer-side mail service that communicates with main process via IPC
// Types without database imports
interface MailAccount {
	id: number;
	user_id: number;
	email: string;
	password: string;
	display_name: string;
	imap_host: string;
	imap_port: number;
	imap_security: 'none' | 'tls' | 'ssl';
	smtp_host: string;
	smtp_port: number;
	smtp_security: 'none' | 'tls' | 'ssl';
	is_active: boolean;
	created_at: Date;
	updated_at: Date;
}

interface MailFolder {
	id: number;
	account_id: number;
	name: string;
	full_name: string;
	folder_type: 'inbox' | 'sent' | 'draft' | 'trash' | 'spam' | 'custom';
	unread_count: number;
	total_count: number;
	created_at: Date;
	updated_at: Date;
}

interface Mail {
	id: number;
	account_id: number;
	folder_id: number;
	message_id: string;
	subject: string;
	from: any;
	to: any;
	cc?: any;
	bcc?: any;
	date: Date;
	body_html?: string;
	body_text?: string;
	text_content?: string;
	attachments?: any;
	is_read: boolean;
	is_flagged: boolean;
	is_deleted: boolean;
	uid: number;
	created_at: Date;
	updated_at: Date;
}

export class MailService {
	// Account Management
	static async createAccount(
		account: Omit<MailAccount, 'id' | 'created_at' | 'updated_at'>,
	): Promise<MailAccount> {
		const result = await window.electronAPI.invoke(
			'mail:create-account',
			account,
		);
		if (result.success) {
			return result.account;
		}
		throw new Error(result.error || 'Failed to create account');
	}

	static async getAccountsByUserId(userId: number): Promise<MailAccount[]> {
		const result = await window.electronAPI.invoke(
			'mail:get-accounts-by-user',
			userId,
		);
		if (result.success) {
			return result.accounts;
		}
		throw new Error(result.error || 'Failed to get accounts');
	}

	static async getAccountById(id: number): Promise<MailAccount | null> {
		const result = await window.electronAPI.invoke(
			'mail:get-account-by-id',
			id,
		);
		if (result.success) {
			return result.account;
		}
		throw new Error(result.error || 'Failed to get account');
	}

	static async updateAccount(
		id: number,
		updates: Partial<MailAccount>,
	): Promise<MailAccount> {
		const result = await window.electronAPI.invoke('mail:update-account', {
			id,
			updates,
		});
		if (result.success) {
			return result.account;
		}
		throw new Error(result.error || 'Failed to update account');
	}

	static async deleteAccount(id: number): Promise<void> {
		const result = await window.electronAPI.invoke('mail:delete-account', id);
		if (!result.success) {
			throw new Error(result.error || 'Failed to delete account');
		}
	}

	// Folder Management
	static async getFoldersByAccount(accountId: number): Promise<MailFolder[]> {
		const result = await window.electronAPI.invoke(
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
		const result = await window.electronAPI.invoke('mail:get-mails-by-folder', {
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
		const result = await window.electronAPI.invoke('mail:get-mail-by-id', id);
		if (result.success) {
			return result.mail;
		}
		throw new Error(result.error || 'Failed to get mail');
	}

	static async markMailAsRead(id: number): Promise<void> {
		const result = await window.electronAPI.invoke('mail:mark-as-read', id);
		if (!result.success) {
			throw new Error(result.error || 'Failed to mark mail as read');
		}
	}

	static async markMailAsUnread(id: number): Promise<void> {
		const result = await window.electronAPI.invoke('mail:mark-as-unread', id);
		if (!result.success) {
			throw new Error(result.error || 'Failed to mark mail as unread');
		}
	}

	static async flagMail(id: number): Promise<void> {
		const result = await window.electronAPI.invoke('mail:flag-mail', id);
		if (!result.success) {
			throw new Error(result.error || 'Failed to flag mail');
		}
	}

	static async unflagMail(id: number): Promise<void> {
		const result = await window.electronAPI.invoke('mail:unflag-mail', id);
		if (!result.success) {
			throw new Error(result.error || 'Failed to unflag mail');
		}
	}

	static async deleteMail(id: number): Promise<void> {
		const result = await window.electronAPI.invoke('mail:delete-mail', id);
		if (!result.success) {
			throw new Error(result.error || 'Failed to delete mail');
		}
	}

	static async searchMails(
		accountId: number,
		query: string,
		limit = 50,
	): Promise<Mail[]> {
		const result = await window.electronAPI.invoke('mail:search-mails', {
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
		const result = await window.electronAPI.invoke(
			'mail:sync-account',
			accountId,
		);
		if (!result.success) {
			throw new Error(result.error || 'Failed to sync account');
		}
	}
}

export const mailService = MailService;
export type { MailAccount, MailFolder, Mail };
