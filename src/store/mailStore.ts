/* eslint-disable import/no-extraneous-dependencies */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import {
	MailAccount,
	Mail,
	MailFolder,
	MailFilter,
	MailRule,
	SmartInbox,
	NotificationSettings,
} from '../types/mail';

// Enable Immer MapSet support
enableMapSet();

interface MailStore {
	// State
	accounts: MailAccount[];
	mails: Map<string, Mail>;
	folders: Map<string, MailFolder>;
	filters: MailFilter[];
	rules: MailRule[];
	smartInboxes: SmartInbox[];

	// UI State
	selectedAccountId: string | null;
	selectedFolderId: string | null;
	selectedMailId: string | null;
	selectedMailIds: Set<string>;
	searchQuery: string;
	isComposing: boolean;
	isSyncing: boolean;
	syncProgress: {
		accountId: string;
		folderName: string;
		current: number;
		total: number;
	} | null;

	// Settings
	notificationSettings: NotificationSettings;

	// Actions - Accounts
	addAccount: (account: MailAccount) => void;
	updateAccount: (accountId: string, updates: Partial<MailAccount>) => void;
	removeAccount: (accountId: string) => void;
	setSelectedAccount: (accountId: string | null) => void;

	// Actions - Mails
	addMails: (mails: Mail[]) => void;
	updateMail: (mailId: string, updates: Partial<Mail>) => void;
	removeMails: (mailIds: string[]) => void;
	setSelectedMail: (mailId: string | null) => void;
	toggleMailSelection: (mailId: string) => void;
	clearMailSelection: () => void;

	// Actions - Folders
	addFolders: (folders: MailFolder[]) => void;
	updateFolder: (folderId: string, updates: Partial<MailFolder>) => void;
	setSelectedFolder: (folderId: string | null) => void;

	// Actions - Filters & Rules
	addFilter: (filter: MailFilter) => void;
	updateFilter: (filterId: string, updates: Partial<MailFilter>) => void;
	removeFilter: (filterId: string) => void;
	addRule: (rule: MailRule) => void;
	updateRule: (ruleId: string, updates: Partial<MailRule>) => void;
	removeRule: (ruleId: string) => void;

	// Actions - Smart Inboxes
	addSmartInbox: (smartInbox: SmartInbox) => void;
	updateSmartInbox: (
		smartInboxId: string,
		updates: Partial<SmartInbox>,
	) => void;
	removeSmartInbox: (smartInboxId: string) => void;

	// Actions - UI
	setSearchQuery: (query: string) => void;
	setIsComposing: (isComposing: boolean) => void;
	setSyncProgress: (progress: MailStore['syncProgress']) => void;

	// Actions - Settings
	updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;

	// Actions - Utility
	clearAll: () => void;

	// Computed getters
	getAccount: (accountId: string) => MailAccount | undefined;
	getMail: (mailId: string) => Mail | undefined;
	getFolder: (folderId: string) => MailFolder | undefined;
	getAccountFolders: (accountId: string) => MailFolder[];
	getFolderMails: (folderId: string) => Mail[];
	getSelectedMails: () => Mail[];
	getUnreadCount: (accountId?: string) => number;
	searchMails: (query: string) => Mail[];
}

export const useMailStore = create<MailStore>()(
	devtools(
		persist(
			immer((set, get) => ({
				// Initial State
				accounts: [],
				mails: new Map(),
				folders: new Map(),
				filters: [],
				rules: [],
				smartInboxes: [],
				selectedAccountId: null,
				selectedFolderId: null,
				selectedMailId: null,
				selectedMailIds: new Set(),
				searchQuery: '',
				isComposing: false,
				isSyncing: false,
				syncProgress: null,
				notificationSettings: {
					enabled: true,
					sound: true,
					showPreview: true,
					groupByAccount: false,
				},

				// Account Actions
				addAccount: (account) =>
					set((state) => {
						state.accounts.push(account);
					}),

				updateAccount: (accountId, updates) =>
					set((state) => {
						const accountIndex = state.accounts.findIndex(
							(a) => a.id === accountId,
						);
						if (accountIndex !== -1) {
							state.accounts[accountIndex] = {
								...state.accounts[accountIndex],
								...updates,
							};
						}
					}),

				removeAccount: (accountId) =>
					set((state) => {
						state.accounts = state.accounts.filter((a) => a.id !== accountId);
						// Also remove associated mails and folders
						const folderIds = Array.from(state.folders.values())
							.filter((f) => f.accountId === accountId)
							.map((f) => f.id);

						folderIds.forEach((folderId) => {
							state.folders.delete(folderId);
						});

						Array.from(state.mails.values())
							.filter((m) => m.accountId === accountId)
							.forEach((mail) => {
								state.mails.delete(mail.id);
							});
					}),

				setSelectedAccount: (accountId) =>
					set((state) => {
						state.selectedAccountId = accountId;
					}),

				// Mail Actions
				addMails: (mails) =>
					set((state) => {
						mails.forEach((mail) => {
							state.mails.set(mail.id, mail);
						});
					}),

				updateMail: (mailId, updates) =>
					set((state) => {
						const mail = state.mails.get(mailId);
						if (mail) {
							state.mails.set(mailId, { ...mail, ...updates });
						}
					}),

				removeMails: (mailIds) =>
					set((state) => {
						mailIds.forEach((id) => {
							state.mails.delete(id);
							state.selectedMailIds.delete(id);
						});
					}),

				setSelectedMail: (mailId) =>
					set((state) => {
						state.selectedMailId = mailId;
					}),

				toggleMailSelection: (mailId) =>
					set((state) => {
						if (state.selectedMailIds.has(mailId)) {
							state.selectedMailIds.delete(mailId);
						} else {
							state.selectedMailIds.add(mailId);
						}
					}),

				clearMailSelection: () =>
					set((state) => {
						state.selectedMailIds.clear();
					}),

				// Folder Actions
				addFolders: (folders) =>
					set((state) => {
						folders.forEach((folder) => {
							state.folders.set(folder.id, folder);
						});
					}),

				updateFolder: (folderId, updates) =>
					set((state) => {
						const folder = state.folders.get(folderId);
						if (folder) {
							state.folders.set(folderId, { ...folder, ...updates });
						}
					}),

				setSelectedFolder: (folderId) =>
					set((state) => {
						state.selectedFolderId = folderId;
					}),

				// Filter & Rule Actions
				addFilter: (filter) =>
					set((state) => {
						state.filters.push(filter);
					}),

				updateFilter: (filterId, updates) =>
					set((state) => {
						const filterIndex = state.filters.findIndex(
							(f) => f.id === filterId,
						);
						if (filterIndex !== -1) {
							state.filters[filterIndex] = {
								...state.filters[filterIndex],
								...updates,
							};
						}
					}),

				removeFilter: (filterId) =>
					set((state) => {
						state.filters = state.filters.filter((f) => f.id !== filterId);
					}),

				addRule: (rule) =>
					set((state) => {
						state.rules.push(rule);
					}),

				updateRule: (ruleId, updates) =>
					set((state) => {
						const ruleIndex = state.rules.findIndex((r) => r.id === ruleId);
						if (ruleIndex !== -1) {
							state.rules[ruleIndex] = {
								...state.rules[ruleIndex],
								...updates,
							};
						}
					}),

				removeRule: (ruleId) =>
					set((state) => {
						state.rules = state.rules.filter((r) => r.id !== ruleId);
					}),

				// Smart Inbox Actions
				addSmartInbox: (smartInbox) =>
					set((state) => {
						state.smartInboxes.push(smartInbox);
					}),

				updateSmartInbox: (smartInboxId, updates) =>
					set((state) => {
						const index = state.smartInboxes.findIndex(
							(s) => s.id === smartInboxId,
						);
						if (index !== -1) {
							state.smartInboxes[index] = {
								...state.smartInboxes[index],
								...updates,
							};
						}
					}),

				removeSmartInbox: (smartInboxId) =>
					set((state) => {
						state.smartInboxes = state.smartInboxes.filter(
							(s) => s.id !== smartInboxId,
						);
					}),

				// UI Actions
				setSearchQuery: (query) =>
					set((state) => {
						state.searchQuery = query;
					}),

				setIsComposing: (isComposing) =>
					set((state) => {
						state.isComposing = isComposing;
					}),

				setSyncProgress: (progress) =>
					set((state) => {
						state.syncProgress = progress;
						state.isSyncing = progress !== null;
					}),

				// Settings Actions
				updateNotificationSettings: (settings) =>
					set((state) => {
						state.notificationSettings = {
							...state.notificationSettings,
							...settings,
						};
					}),

				// Utility Actions
				clearAll: () =>
					set((state) => {
						state.accounts = [];
						state.mails.clear();
						state.folders.clear();
						state.filters = [];
						state.rules = [];
						state.smartInboxes = [];
						state.selectedAccountId = null;
						state.selectedFolderId = null;
						state.selectedMailId = null;
						state.selectedMailIds.clear();
						state.searchQuery = '';
						state.isComposing = false;
						state.isSyncing = false;
						state.syncProgress = null;
					}),

				// Computed Getters
				getAccount: (accountId) => {
					return get().accounts.find((a) => a.id === accountId);
				},

				getMail: (mailId) => {
					return get().mails.get(mailId);
				},

				getFolder: (folderId) => {
					return get().folders.get(folderId);
				},

				getAccountFolders: (accountId) => {
					return Array.from(get().folders.values()).filter(
						(f) => f.accountId === accountId,
					);
				},

				getFolderMails: (folderId) => {
					return Array.from(get().mails.values()).filter(
						(m) => m.folderId === folderId,
					);
				},

				getSelectedMails: () => {
					const selectedIds = Array.from(get().selectedMailIds);
					return selectedIds
						.map((id) => get().mails.get(id))
						.filter((mail) => mail !== undefined) as Mail[];
				},

				getUnreadCount: (accountId) => {
					const mails = Array.from(get().mails.values());
					return mails.filter(
						(m) => !m.isRead && (!accountId || m.accountId === accountId),
					).length;
				},

				searchMails: (query) => {
					if (!query.trim()) return [];

					const lowerQuery = query.toLowerCase();
					return Array.from(get().mails.values()).filter((mail) => {
						return (
							mail.subject.toLowerCase().includes(lowerQuery) ||
							mail.from.some(
								(addr) =>
									addr.name.toLowerCase().includes(lowerQuery) ||
									addr.address.toLowerCase().includes(lowerQuery),
							) ||
							mail.snippet.toLowerCase().includes(lowerQuery)
						);
					});
				},
			})),
			{
				name: 'mail-store',
				partialize: (state) => ({
					accounts: state.accounts,
					filters: state.filters,
					rules: state.rules,
					smartInboxes: state.smartInboxes,
					notificationSettings: state.notificationSettings,
				}),
			},
		),
		{
			name: 'MailStore',
		},
	),
);
