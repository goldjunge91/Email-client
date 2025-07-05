/* eslint-disable react/function-component-definition */
import React from 'react';
import { useMailStoreContext } from '@/renderer/context/MailStoreProvider';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const MailStoreTestComponent: React.FC = () => {
	const { store, selectedAccount, filteredMails, selectAccount, syncAccount } =
		useMailStoreContext();

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Mail Store Status</CardTitle>
					<CardDescription>
						Debug-Informationen über den Mail Store
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<h3 className="font-semibold mb-2">Accounts</h3>
						<Badge variant="outline">{store.accounts.length} Accounts</Badge>
					</div>

					<div>
						<h3 className="font-semibold mb-2">Mails</h3>
						<Badge variant="outline">{store.mails.size} Mails</Badge>
					</div>

					<div>
						<h3 className="font-semibold mb-2">Folders</h3>
						<Badge variant="outline">{store.folders.size} Folders</Badge>
					</div>

					<div>
						<h3 className="font-semibold mb-2">Selected Account</h3>
						<Badge variant={selectedAccount ? 'default' : 'secondary'}>
							{selectedAccount
								? selectedAccount.email
								: 'Kein Account ausgewählt'}
						</Badge>
					</div>

					<div>
						<h3 className="font-semibold mb-2">Filtered Mails</h3>
						<Badge variant="outline">
							{filteredMails.length} Mails gefiltert
						</Badge>
					</div>

					<div>
						<h3 className="font-semibold mb-2">Sync Status</h3>
						<Badge variant={store.isSyncing ? 'default' : 'secondary'}>
							{store.isSyncing ? 'Syncing...' : 'Idle'}
						</Badge>
					</div>

					<div>
						<h3 className="font-semibold mb-2">Search Query</h3>
						<Badge variant="outline">
							{store.searchQuery || 'Keine Suche aktiv'}
						</Badge>
					</div>

					<div className="flex gap-2 flex-wrap">
						<Button
							onClick={() => {
								// Test Account hinzufügen
								const testAccount = {
									id: 'test-account-1',
									email: 'test@example.com',
									name: 'Test Account',
									displayName: 'Test User',
									isDefault: true,
									isActive: true,
									settings: {
										incomingServer: {
											type: 'imap' as const,
											host: 'imap.example.com',
											port: 993,
											secure: true,
											auth: { user: 'test@example.com', pass: 'password' },
										},
										outgoingServer: {
											type: 'smtp' as const,
											host: 'smtp.example.com',
											port: 587,
											secure: true,
											auth: { user: 'test@example.com', pass: 'password' },
										},
										autoSync: true,
										syncInterval: 300000,
										maxSyncItems: 100,
										syncOnStartup: true,
									},
									folders: [],
									stats: {
										totalMails: 0,
										unreadMails: 0,
										lastSync: new Date(),
										storageUsed: 0,
									},
									createdAt: new Date(),
									updatedAt: new Date(),
								};
								store.addAccount(testAccount);
							}}
							variant="outline"
						>
							Test Account hinzufügen
						</Button>

						<Button
							onClick={() => {
								// Test Mails hinzufügen
								const testMails = [
									{
										id: 'mail-1',
										messageId: '<test-1@example.com>',
										accountId: 'test-account-1',
										folderId: 'inbox',
										subject: 'Willkommen bei der Mail App!',
										from: [
											{ name: 'Mail App Team', address: 'team@mailapp.com' },
										],
										to: [{ name: 'Test User', address: 'test@example.com' }],
										cc: [],
										bcc: [],
										replyTo: [],
										date: new Date(),
										isRead: false,
										isStarred: true,
										isImportant: true,
										hasAttachments: false,
										attachments: [],
										textContent:
											'Herzlich willkommen! Dies ist eine Test-Mail.',
										htmlContent:
											'<p>Herzlich willkommen! Dies ist eine Test-Mail.</p>',
										snippet: 'Herzlich willkommen! Dies ist eine Test-Mail.',
										labels: ['important'],
										category: 'primary' as const,
										priority: 'high' as const,
										size: 1024,
										flags: ['\\Seen'],
										headers: {},
										isDraft: false,
										isSent: false,
										isDeleted: false,
										isSpam: false,
										isArchived: false,
										createdAt: new Date(),
										updatedAt: new Date(),
									},
									{
										id: 'mail-2',
										messageId: '<test-2@example.com>',
										accountId: 'test-account-1',
										folderId: 'inbox',
										subject: 'Store Integration funktioniert!',
										from: [
											{ name: 'GitHub Copilot', address: 'copilot@github.com' },
										],
										to: [{ name: 'Test User', address: 'test@example.com' }],
										cc: [],
										bcc: [],
										replyTo: [],
										date: new Date(Date.now() - 3600000),
										isRead: false,
										isStarred: false,
										isImportant: false,
										hasAttachments: true,
										attachments: [
											{
												id: 'attachment-1',
												filename: 'phase2-update.pdf',
												contentType: 'application/pdf',
												size: 2048,
											},
										],
										textContent:
											'Die Store Integration ist erfolgreich! Phase 2 läuft.',
										htmlContent:
											'<p>Die Store Integration ist erfolgreich! <strong>Phase 2 läuft.</strong></p>',
										snippet:
											'Die Store Integration ist erfolgreich! Phase 2 läuft.',
										labels: ['development'],
										category: 'updates' as const,
										priority: 'normal' as const,
										size: 2048,
										flags: [],
										headers: {},
										isDraft: false,
										isSent: false,
										isDeleted: false,
										isSpam: false,
										isArchived: false,
										createdAt: new Date(),
										updatedAt: new Date(),
									},
								];
								store.addMails(testMails);
							}}
							variant="outline"
						>
							Test Mails hinzufügen
						</Button>

						<Button
							onClick={() => {
								// Test Folder hinzufügen
								const testFolder = {
									id: 'inbox',
									name: 'Inbox',
									path: 'INBOX',
									accountId: 'test-account-1',
									type: 'inbox' as const,
									unreadCount: 2,
									totalCount: 2,
									icon: undefined as any, // Will be set by UI
									parent: undefined,
									children: [],
									attributes: [],
									delimiter: '/',
									subscribed: true,
									createdAt: new Date(),
									updatedAt: new Date(),
								};
								store.addFolders([testFolder]);
							}}
							variant="outline"
						>
							Test Folder hinzufügen
						</Button>

						{store.accounts.length > 0 && (
							<Button
								onClick={() => selectAccount('test-account-1')}
								variant="outline"
							>
								Test Account auswählen
							</Button>
						)}

						{selectedAccount && (
							<Button
								onClick={() => syncAccount(selectedAccount.id)}
								variant="outline"
							>
								Account synchronisieren
							</Button>
						)}

						<Button
							onClick={() => {
								store.clearAll();
							}}
							variant="destructive"
						>
							Store leeren
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
