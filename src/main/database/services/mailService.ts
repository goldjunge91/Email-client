/* eslint-disable import/no-extraneous-dependencies */
import { eq, desc, and } from 'drizzle-orm';

import type { MailAccount, MailFolder, Mail, SyncStatus } from '@/types/mail';
import { EncryptionService } from '../../encryption';
import { getDatabase } from '../connection';
import { mailAccounts, mailFolders, mails, syncStatus } from '../schema';

export class MailService {
	private db = getDatabase();

	// Account Management
	async createAccount(
		account: Omit<MailAccount, 'id' | 'created_at' | 'updated_at'>,
	): Promise<MailAccount> {
		const accountData = {
			...account,
			// Encrypt password before storing
			password: EncryptionService.encrypt(account.password),
			created_at: new Date(),
			updated_at: new Date(),
		};

		const [newAccount] = await this.db
			.insert(mailAccounts)
			.values(accountData)
			.returning();

		// Return account with decrypted password for immediate use
		return {
			...newAccount,
			password: account.password,
		} as MailAccount;
	}

	async getAllAccounts(): Promise<MailAccount[]> {
		const accounts = await this.db
			.select()
			.from(mailAccounts)
			.where(eq(mailAccounts.is_active, true))
			.orderBy(mailAccounts.created_at);
		return accounts as MailAccount[];
	}

	async getAccountsByUserId(userId: number): Promise<MailAccount[]> {
		const accounts = await this.db
			.select()
			.from(mailAccounts)
			.where(
				and(eq(mailAccounts.user_id, userId), eq(mailAccounts.is_active, true)),
			)
			.orderBy(mailAccounts.created_at);

		// Decrypt passwords for returned accounts
		const decryptedAccounts = await Promise.all(
			accounts.map(async (account) => ({
				...account,
				password: await EncryptionService.decrypt(account.password),
			})),
		);

		return decryptedAccounts as MailAccount[];
	}

	async getAccountById(id: number): Promise<MailAccount | null> {
		const [account] = await this.db
			.select()
			.from(mailAccounts)
			.where(eq(mailAccounts.id, id));

		if (!account) return null;

		// Decrypt password when retrieving
		return {
			...account,
			password: await EncryptionService.decrypt(account.password),
		} as MailAccount;
	}

	async updateAccount(
		id: number,
		updates: Partial<MailAccount>,
	): Promise<MailAccount> {
		const [updatedAccount] = await this.db
			.update(mailAccounts)
			.set({
				...updates,
				updated_at: new Date(),
			})
			.where(eq(mailAccounts.id, id))
			.returning();
		return updatedAccount as MailAccount;
	}

	async deleteAccount(id: number): Promise<void> {
		await this.db
			.update(mailAccounts)
			.set({
				is_active: false,
				updated_at: new Date(),
			})
			.where(eq(mailAccounts.id, id));
	}

	// Folder Management
	async createFolder(
		folder: Omit<MailFolder, 'id' | 'created_at' | 'updated_at'>,
	): Promise<MailFolder> {
		const [newFolder] = await this.db
			.insert(mailFolders)
			.values({
				...folder,
				created_at: new Date(),
				updated_at: new Date(),
			})
			.returning();
		return newFolder as MailFolder;
	}

	async getFoldersByAccount(accountId: number): Promise<MailFolder[]> {
		const folders = await this.db
			.select()
			.from(mailFolders)
			.where(eq(mailFolders.account_id, accountId))
			.orderBy(mailFolders.name);
		return folders as MailFolder[];
	}

	async updateFolderCounts(
		folderId: number,
		unreadCount: number,
		totalCount: number,
	): Promise<void> {
		await this.db
			.update(mailFolders)
			.set({
				unread_count: unreadCount,
				total_count: totalCount,
				updated_at: new Date(),
			})
			.where(eq(mailFolders.id, folderId));
	}

	// Mail Management
	async createMail(
		mail: Omit<Mail, 'id' | 'created_at' | 'updated_at'>,
	): Promise<Mail> {
		const [newMail] = await this.db
			.insert(mails)
			.values({
				...mail,
				created_at: new Date(),
				updated_at: new Date(),
			})
			.returning();
		return newMail as Mail;
	}

	async getMailsByFolder(
		folderId: number,
		limit = 50,
		offset = 0,
	): Promise<Mail[]> {
		const mailList = await this.db
			.select()
			.from(mails)
			.where(and(eq(mails.folder_id, folderId), eq(mails.is_deleted, false)))
			.orderBy(desc(mails.date))
			.limit(limit)
			.offset(offset);
		return mailList as Mail[];
	}

	async getMailById(id: number): Promise<Mail | null> {
		const [mail] = await this.db.select().from(mails).where(eq(mails.id, id));
		return (mail as Mail) || null;
	}

	async markMailAsRead(id: number): Promise<void> {
		await this.db
			.update(mails)
			.set({
				is_read: true,
				updated_at: new Date(),
			})
			.where(eq(mails.id, id));
	}

	async toggleMailStar(id: number): Promise<void> {
		const [mail] = await this.db
			.select({ is_starred: mails.is_starred })
			.from(mails)
			.where(eq(mails.id, id));

		if (mail) {
			await this.db
				.update(mails)
				.set({
					is_starred: !mail.is_starred,
					updated_at: new Date(),
				})
				.where(eq(mails.id, id));
		}
	}

	async deleteMail(id: number): Promise<void> {
		await this.db
			.update(mails)
			.set({
				is_deleted: true,
				updated_at: new Date(),
			})
			.where(eq(mails.id, id));
	}

	async searchMails(
		accountId: number,
		query: string,
		limit = 50,
	): Promise<Mail[]> {
		// Für jetzt eine einfache Suche - kann später mit Full-Text-Search erweitert werden
		const searchResults = await this.db
			.select()
			.from(mails)
			.where(and(eq(mails.account_id, accountId), eq(mails.is_deleted, false)))
			.orderBy(desc(mails.date))
			.limit(limit);

		// Client-seitige Filterung (kann später in die DB verlagert werden)
		return searchResults.filter(
			(mail) =>
				mail.subject.toLowerCase().includes(query.toLowerCase()) ||
				mail.text_content?.toLowerCase().includes(query.toLowerCase()) ||
				JSON.stringify(mail.from).toLowerCase().includes(query.toLowerCase()),
		) as Mail[];
	}

	// Sync Status Management
	async updateSyncStatus(
		status: Omit<SyncStatus, 'id' | 'created_at'>,
	): Promise<void> {
		await this.db.insert(syncStatus).values({
			...status,
			created_at: new Date(),
		});
	}

	async getLastSyncStatus(
		accountId: number,
		folderId?: number,
	): Promise<SyncStatus | null> {
		const query = this.db
			.select()
			.from(syncStatus)
			.where(eq(syncStatus.account_id, accountId))
			.orderBy(desc(syncStatus.created_at))
			.limit(1);

		if (folderId) {
			query.where(eq(syncStatus.folder_id, folderId));
		}

		const [status] = await query;
		return (status as SyncStatus) || null;
	}
}

// Singleton Instance
export const mailService = new MailService();
