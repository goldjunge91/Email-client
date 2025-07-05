// src/core/mail/mailService.ts

import { EventEmitter } from 'events';
import type {
	Mail,
	MailAccount,
	MailFolder,
	MailFilter,
	MailRule,
	MailSyncStatus,
	SearchQuery,
	SearchResult,
} from '../../types/mail';

interface MailServiceConfig {
	syncInterval?: number; // in milliseconds
	batchSize?: number;
	enableAutoSync?: boolean;
	cacheEnabled?: boolean;
}

export class MailService extends EventEmitter {
	private accounts: Map<string, MailAccount> = new Map();

	private mails: Map<string, Mail> = new Map();

	private folders: Map<string, MailFolder> = new Map();

	private rules: Map<string, MailRule> = new Map();

	private syncStatus: Map<string, MailSyncStatus> = new Map();

	private config: MailServiceConfig;

	private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

	constructor(config: MailServiceConfig = {}) {
		super();
		this.config = {
			syncInterval: 60000, // 1 minute default
			batchSize: 50,
			enableAutoSync: true,
			cacheEnabled: true,
			...config,
		};
	}

	// Account Management
	async addAccount(account: MailAccount): Promise<void> {
		try {
			// Verify account connection
			const verified = await this.verifyAccount(account);
			if (!verified) {
				throw new Error('Failed to verify account credentials');
			}

			// Store account
			this.accounts.set(account.id, account);

			// Initialize sync status
			this.syncStatus.set(account.id, {
				accountId: account.id,
				isRunning: false,
				lastSync: new Date(),
			});

			// Fetch initial folders
			await this.fetchFolders(account.id);

			// Start auto-sync if enabled
			if (this.config.enableAutoSync) {
				this.startAutoSync(account.id);
			}

			this.emit('account:added', account);
		} catch (error) {
			this.emit('account:error', { accountId: account.id, error });
			throw error;
		}
	}

	async removeAccount(accountId: string): Promise<void> {
		// Stop auto-sync
		this.stopAutoSync(accountId);

		// Remove account data
		this.accounts.delete(accountId);

		// Remove all mails for this account
		for (const [mailId, mail] of this.mails.entries()) {
			if (mail.accountId === accountId) {
				this.mails.delete(mailId);
			}
		}

		// Remove all folders for this account
		for (const [folderId, folder] of this.folders.entries()) {
			if (folder.accountId === accountId) {
				this.folders.delete(folderId);
			}
		}

		this.emit('account:removed', accountId);
	}

	async updateAccount(
		accountId: string,
		updates: Partial<MailAccount>,
	): Promise<void> {
		const account = this.accounts.get(accountId);
		if (!account) {
			throw new Error('Account not found');
		}

		const updatedAccount = { ...account, ...updates };
		this.accounts.set(accountId, updatedAccount);

		// Re-verify if credentials changed
		if (updates.settings) {
			await this.verifyAccount(updatedAccount);
		}

		this.emit('account:updated', updatedAccount);
	}

	getAccount(accountId: string): MailAccount | undefined {
		return this.accounts.get(accountId);
	}

	getAccounts(): MailAccount[] {
		return Array.from(this.accounts.values());
	}

	// Mail Synchronization
	async syncAccount(accountId: string): Promise<void> {
		const account = this.accounts.get(accountId);
		if (!account) {
			throw new Error('Account not found');
		}

		const status = this.syncStatus.get(accountId);
		if (status?.isRunning) {
			return; // Already syncing
		}

		this.updateSyncStatus(accountId, { isRunning: true, progress: 0 });

		try {
			// Sync each folder
			const folders = this.getFoldersByAccount(accountId);
			for (let i = 0; i < folders.length; i++) {
				const folder = folders[i];
				await this.syncFolder(accountId, folder.id);

				const progress = ((i + 1) / folders.length) * 100;
				this.updateSyncStatus(accountId, { progress });
			}

			this.updateSyncStatus(accountId, {
				isRunning: false,
				lastSync: new Date(),
				progress: 100,
			});

			this.emit('sync:completed', accountId);
		} catch (error) {
			this.updateSyncStatus(accountId, {
				isRunning: false,
				error: error.message,
			});
			this.emit('sync:error', { accountId, error });
			throw error;
		}
	}

	private async syncFolder(accountId: string, folderId: string): Promise<void> {
		const account = this.accounts.get(accountId);
		const folder = this.folders.get(folderId);

		if (!account || !folder) {
			throw new Error('Account or folder not found');
		}

		// This would connect to IMAP/POP3 and fetch messages
		// For now, we'll simulate with mock data
		this.emit('sync:folder', { accountId, folderId });

		// In real implementation:
		// 1. Connect to mail server
		// 2. Fetch message headers
		// 3. Compare with local cache
		// 4. Download new messages
		// 5. Apply mail rules
		// 6. Update folder counts
	}

	private startAutoSync(accountId: string): void {
		if (this.syncIntervals.has(accountId)) {
			return; // Already running
		}

		const interval = setInterval(() => {
			this.syncAccount(accountId).catch((error) => {
				console.error(`Auto-sync failed for account ${accountId}:`, error);
			});
		}, this.config.syncInterval);

		this.syncIntervals.set(accountId, interval);
	}

	private stopAutoSync(accountId: string): void {
		const interval = this.syncIntervals.get(accountId);
		if (interval) {
			clearInterval(interval);
			this.syncIntervals.delete(accountId);
		}
	}

	// Folder Management
	async fetchFolders(accountId: string): Promise<void> {
		const account = this.accounts.get(accountId);
		if (!account) {
			throw new Error('Account not found');
		}

		// In real implementation, fetch folders from IMAP
		// For now, create default folders
		const defaultFolders: Partial<MailFolder>[] = [
			{ name: 'Inbox', type: 'inbox', icon: '📥' },
			{ name: 'Sent', type: 'sent', icon: '📤' },
			{ name: 'Drafts', type: 'drafts', icon: '📝' },
			{ name: 'Trash', type: 'trash', icon: '🗑️' },
			{ name: 'Spam', type: 'spam', icon: '🚫' },
			{ name: 'Archive', type: 'archive', icon: '📦' },
		];

		for (const folderData of defaultFolders) {
			const folder: MailFolder = {
				id: `${accountId}-${folderData.type}`,
				accountId,
				path: folderData.name!,
				unreadCount: 0,
				totalCount: 0,
				...(folderData as any),
			};

			this.folders.set(folder.id, folder);
		}

		this.emit('folders:updated', accountId);
	}

	getFoldersByAccount(accountId: string): MailFolder[] {
		return Array.from(this.folders.values()).filter(
			(folder) => folder.accountId === accountId,
		);
	}

	getFolder(folderId: string): MailFolder | undefined {
		return this.folders.get(folderId);
	}

	// Mail Operations
	async getMails(filter?: MailFilter): Promise<Mail[]> {
		let mails = Array.from(this.mails.values());

		if (filter) {
			mails = this.applyFilter(mails, filter);
		}

		return mails.sort((a, b) => b.date.getTime() - a.date.getTime());
	}

	getMail(mailId: string): Mail | undefined {
		return this.mails.get(mailId);
	}

	async markAsRead(mailIds: string[]): Promise<void> {
		for (const mailId of mailIds) {
			const mail = this.mails.get(mailId);
			if (mail && !mail.isRead) {
				mail.isRead = true;
				this.mails.set(mailId, mail);
				this.updateFolderCounts(mail.folderId);
			}
		}

		this.emit('mails:updated', mailIds);
	}

	async markAsUnread(mailIds: string[]): Promise<void> {
		for (const mailId of mailIds) {
			const mail = this.mails.get(mailId);
			if (mail && mail.isRead) {
				mail.isRead = false;
				this.mails.set(mailId, mail);
				this.updateFolderCounts(mail.folderId);
			}
		}

		this.emit('mails:updated', mailIds);
	}

	async flagMails(mailIds: string[], flagged: boolean): Promise<void> {
		for (const mailId of mailIds) {
			const mail = this.mails.get(mailId);
			if (mail) {
				mail.isFlagged = flagged;
				this.mails.set(mailId, mail);
			}
		}

		this.emit('mails:updated', mailIds);
	}

	async moveMails(mailIds: string[], targetFolderId: string): Promise<void> {
		const targetFolder = this.folders.get(targetFolderId);
		if (!targetFolder) {
			throw new Error('Target folder not found');
		}

		for (const mailId of mailIds) {
			const mail = this.mails.get(mailId);
			if (mail) {
				const oldFolderId = mail.folderId;
				mail.folderId = targetFolderId;
				this.mails.set(mailId, mail);

				// Update folder counts
				this.updateFolderCounts(oldFolderId);
				this.updateFolderCounts(targetFolderId);
			}
		}

		this.emit('mails:moved', { mailIds, targetFolderId });
	}

	async deleteMails(
		mailIds: string[],
		permanent: boolean = false,
	): Promise<void> {
		if (permanent) {
			// Permanently delete
			for (const mailId of mailIds) {
				const mail = this.mails.get(mailId);
				if (mail) {
					this.mails.delete(mailId);
					this.updateFolderCounts(mail.folderId);
				}
			}
			this.emit('mails:deleted', mailIds);
		} else {
			// Move to trash
			const account = this.getAccounts()[0]; // TODO: Get correct account
			const trashFolder = this.getFoldersByAccount(account.id).find(
				(f) => f.type === 'trash',
			);

			if (trashFolder) {
				await this.moveMails(mailIds, trashFolder.id);
			}
		}
	}

	// Search
	async search(query: SearchQuery): Promise<SearchResult> {
		let mails = await this.getMails(query.filters);

		// Apply text search
		if (query.query) {
			const searchTerm = query.query.toLowerCase();
			mails = mails.filter(
				(mail) =>
					mail.subject.toLowerCase().includes(searchTerm) ||
					mail.snippet.toLowerCase().includes(searchTerm) ||
					mail.from.some(
						(addr) =>
							addr.name?.toLowerCase().includes(searchTerm) ||
							addr.address.toLowerCase().includes(searchTerm),
					),
			);
		}

		// Sort results
		if (query.sortBy) {
			mails.sort((a, b) => {
				switch (query.sortBy) {
					case 'date':
						return query.sortOrder === 'asc'
							? a.date.getTime() - b.date.getTime()
							: b.date.getTime() - a.date.getTime();
					case 'sender':
						const aName = a.from[0]?.name || a.from[0]?.address || '';
						const bName = b.from[0]?.name || b.from[0]?.address || '';
						return query.sortOrder === 'asc'
							? aName.localeCompare(bName)
							: bName.localeCompare(aName);
					case 'subject':
						return query.sortOrder === 'asc'
							? a.subject.localeCompare(b.subject)
							: b.subject.localeCompare(a.subject);
					default:
						return 0;
				}
			});
		}

		// Apply pagination
		const totalCount = mails.length;
		if (query.limit) {
			const offset = query.offset || 0;
			mails = mails.slice(offset, offset + query.limit);
		}

		return {
			mails,
			totalCount,
			highlights: new Map(), // TODO: Implement highlighting
		};
	}

	// Mail Rules
	addRule(rule: MailRule): void {
		this.rules.set(rule.id, rule);
		this.emit('rule:added', rule);
	}

	removeRule(ruleId: string): void {
		this.rules.delete(ruleId);
		this.emit('rule:removed', ruleId);
	}

	getRules(): MailRule[] {
		return Array.from(this.rules.values()).sort(
			(a, b) => a.priority - b.priority,
		);
	}

	private async applyRules(mail: Mail): Promise<void> {
		const rules = this.getRules().filter((r) => r.isActive);

		for (const rule of rules) {
			if (this.matchesRule(mail, rule)) {
				await this.executeRuleActions(mail, rule);
			}
		}
	}

	private matchesRule(mail: Mail, rule: MailRule): boolean {
		const matches = rule.conditions.map((condition) => {
			switch (condition.field) {
				case 'from':
					return mail.from.some((addr) =>
						this.matchesCondition(addr.address, condition),
					);
				case 'subject':
					return this.matchesCondition(mail.subject, condition);
				case 'body':
					return this.matchesCondition(mail.snippet, condition);
				case 'hasAttachment':
					return mail.hasAttachments === condition.value;
				default:
					return false;
			}
		});

		return rule.matchType === 'all'
			? matches.every((m) => m)
			: matches.some((m) => m);
	}

	private matchesCondition(value: string, condition: any): boolean {
		const testValue = condition.caseSensitive ? value : value.toLowerCase();
		const conditionValue = condition.caseSensitive
			? condition.value
			: condition.value.toLowerCase();

		switch (condition.operator) {
			case 'contains':
				return testValue.includes(conditionValue);
			case 'equals':
				return testValue === conditionValue;
			case 'startsWith':
				return testValue.startsWith(conditionValue);
			case 'endsWith':
				return testValue.endsWith(conditionValue);
			default:
				return false;
		}
	}

	private async executeRuleActions(mail: Mail, rule: MailRule): Promise<void> {
		for (const action of rule.actions) {
			switch (action.type) {
				case 'move':
					if (action.value) {
						await this.moveMails([mail.id], action.value);
					}
					break;
				case 'markRead':
					await this.markAsRead([mail.id]);
					break;
				case 'flag':
					await this.flagMails([mail.id], true);
					break;
				case 'label':
					if (action.value) {
						mail.labels = [...(mail.labels || []), action.value];
						this.mails.set(mail.id, mail);
					}
					break;
				case 'delete':
					await this.deleteMails([mail.id], true);
					break;
			}
		}
	}

	// Helper Methods
	private applyFilter(mails: Mail[], filter: MailFilter): Mail[] {
		return mails.filter((mail) => {
			if (filter.accounts && !filter.accounts.includes(mail.accountId)) {
				return false;
			}
			if (filter.folders && !filter.folders.includes(mail.folderId)) {
				return false;
			}
			if (filter.isRead !== undefined && mail.isRead !== filter.isRead) {
				return false;
			}
			if (
				filter.isFlagged !== undefined &&
				mail.isFlagged !== filter.isFlagged
			) {
				return false;
			}
			if (
				filter.hasAttachments !== undefined &&
				mail.hasAttachments !== filter.hasAttachments
			) {
				return false;
			}
			if (filter.dateFrom && mail.date < filter.dateFrom) {
				return false;
			}
			if (filter.dateTo && mail.date > filter.dateTo) {
				return false;
			}
			if (
				filter.labels &&
				!filter.labels.some((label) => mail.labels?.includes(label))
			) {
				return false;
			}
			if (filter.category && mail.category !== filter.category) {
				return false;
			}

			return true;
		});
	}

	private updateFolderCounts(folderId: string): void {
		const folder = this.folders.get(folderId);
		if (!folder) return;

		const folderMails = Array.from(this.mails.values()).filter(
			(mail) => mail.folderId === folderId,
		);

		folder.totalCount = folderMails.length;
		folder.unreadCount = folderMails.filter((mail) => !mail.isRead).length;

		this.folders.set(folderId, folder);
		this.emit('folder:updated', folder);
	}

	private updateSyncStatus(
		accountId: string,
		updates: Partial<MailSyncStatus>,
	): void {
		const current = this.syncStatus.get(accountId) || {
			accountId,
			isRunning: false,
		};

		const updated = { ...current, ...updates };
		this.syncStatus.set(accountId, updated);
		this.emit('sync:status', updated);
	}

	private async verifyAccount(account: MailAccount): Promise<boolean> {
		// In real implementation, this would test the connection
		// For now, simulate verification
		return new Promise((resolve) => {
			setTimeout(() => resolve(true), 1000);
		});
	}

	// Cleanup
	destroy(): void {
		// Stop all auto-sync intervals
		for (const interval of this.syncIntervals.values()) {
			clearInterval(interval);
		}
		this.syncIntervals.clear();

		// Clear all data
		this.accounts.clear();
		this.mails.clear();
		this.folders.clear();
		this.rules.clear();
		this.syncStatus.clear();

		// Remove all listeners
		this.removeAllListeners();
	}
}

// Export singleton instance
export const mailService = new MailService();
