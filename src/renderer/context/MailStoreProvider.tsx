/* eslint-disable no-console */
/* eslint-disable react/function-component-definition */
/* eslint-disable prettier/prettier */
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useMailStore } from '@/store/mailStore';
import { MailAccount, Mail, MailFolder } from '@/types/mail';

// Context für Mail Store
interface MailStoreContextType {
	// Store instance
	store: ReturnType<typeof useMailStore>;

	// Computed values
	selectedAccount: MailAccount | null;
	selectedFolder: MailFolder | null;
	selectedMail: Mail | null;
	filteredMails: Mail[];

	// Actions
	selectAccount: (accountId: string) => void;
	selectFolder: (folderId: string) => void;
	selectMail: (mailId: string) => void;
	searchMails: (query: string) => void;
	syncAccount: (accountId: string) => Promise<void>;
}

const MailStoreContext = createContext<MailStoreContextType | null>(null);

interface MailStoreProviderProps {
	children: ReactNode;
}

export const MailStoreProvider: React.FC<MailStoreProviderProps> = ({
	children,
}) => {
	const store = useMailStore();

	// IPC Event Listeners Setup
	useEffect(() => {
		const setupIpcListeners = () => {
			// Account Events
			window.electron.mail.onAccountAdded((account: MailAccount) => {
				store.addAccount(account);
			});

			window.electron.mail.onAccountUpdated((account: MailAccount) => {
				store.updateAccount(account.id, account);
			});

			window.electron.mail.onAccountRemoved((accountId: string) => {
				store.removeAccount(accountId);
			});

			// Mail Events
			window.electron.mail.onMailsReceived(
				(accountId: string, mails: Mail[]) => {
					store.addMails(mails);
				},
			);

			window.electron.mail.onMailUpdated((mail: Mail) => {
				store.updateMail(mail.id, mail);
			});

			window.electron.mail.onMailDeleted((mailId: string) => {
				store.removeMail(mailId);
			});

			// Folder Events
			window.electron.mail.onFoldersReceived(
				(accountId: string, folders: MailFolder[]) => {
					store.addFolders(folders);
				},
			);

			// Sync Events
			window.electron.mail.onSyncStarted((accountId: string) => {
				store.setSyncStatus(accountId, true);
			});

			window.electron.mail.onSyncCompleted((accountId: string) => {
				store.setSyncStatus(accountId, false);
			});

			window.electron.mail.onSyncError((accountId: string, error: string) => {
				store.setSyncStatus(accountId, false);
				console.error('Sync error:', error);
			});
		};

		setupIpcListeners();
	}, [store]);

	// Computed values
	const selectedAccount = store.selectedAccountId
		? store.accounts.find((acc) => acc.id === store.selectedAccountId) || null
		: null;

	const selectedFolder = store.selectedFolderId
		? store.folders.get(store.selectedFolderId) || null
		: null;

	const selectedMail = store.selectedMailId
		? store.mails.get(store.selectedMailId) || null
		: null;

	const filteredMails = React.useMemo(() => {
		const allMails = Array.from(store.mails.values());

		// Filter by selected folder
		let filtered = store.selectedFolderId
			? allMails.filter((mail) => mail.folderId === store.selectedFolderId)
			: allMails;

		// Filter by search query
		if (store.searchQuery) {
			const query = store.searchQuery.toLowerCase();
			filtered = filtered.filter(
				(mail) =>
					mail.subject.toLowerCase().includes(query) ||
					mail.from.some(
						(addr) =>
							addr.name?.toLowerCase().includes(query) ||
							addr.address.toLowerCase().includes(query),
					) ||
					mail.textContent?.toLowerCase().includes(query),
			);
		}

		// Sort by date (newest first)
		return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
	}, [store.mails, store.selectedFolderId, store.searchQuery]);

	// Actions
	const selectAccount = React.useCallback((accountId: string) => {
		store.setSelectedAccount(accountId);
	}, [store]);

	const selectFolder = React.useCallback((folderId: string) => {
		store.setSelectedFolder(folderId);
	}, [store]);

	const selectMail = React.useCallback((mailId: string) => {
		store.setSelectedMail(mailId);
	}, [store]);

	const searchMails = React.useCallback((query: string) => {
		store.setSearchQuery(query);
	}, [store]);

	const syncAccount = React.useCallback(async (accountId: string) => {
		try {
			await window.electron.mail.syncAccount(accountId);
		} catch (error) {
			console.error('Failed to sync account:', error);
		}
	}, []);

	const contextValue: MailStoreContextType = React.useMemo(() => ({
		store,
		selectedAccount,
		selectedFolder,
		selectedMail,
		filteredMails,
		selectAccount,
		selectFolder,
		selectMail,
		searchMails,
		syncAccount,
	}), [
		store,
		selectedAccount,
		selectedFolder,
		selectedMail,
		filteredMails,
		selectAccount,
		selectFolder,
		selectMail,
		searchMails,
		syncAccount,
	]);

	return (
		<MailStoreContext.Provider value={contextValue}>
			{children}
		</MailStoreContext.Provider>
	);
};

// Custom Hook für Mail Store Zugriff
export const useMailStoreContext = (): MailStoreContextType => {
	const context = useContext(MailStoreContext);
	if (!context) {
		throw new Error(
			'useMailStoreContext must be used within a MailStoreProvider',
		);
	}
	return context;
};
