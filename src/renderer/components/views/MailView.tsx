import React from 'react';
import {
	Mail as MailIcon,
	Inbox,
	Send,
	Trash2,
	Archive,
	Star,
	RefreshCw,
	Plus,
} from 'lucide-react';
import { useMailStoreContext } from '../../context/MailStoreProvider';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';

export default function MailView() {
	const {
		store,
		selectedAccount,
		selectedFolder,
		selectedMail,
		filteredMails,
		selectAccount,
		selectFolder,
		syncAccount,
	} = useMailStoreContext();

	// Direkte Zugriffe auf Store-Daten
	const { accounts, isLoading, error } = store;
	const folders = Array.from(store.folders.values());

	// Aktuelle Folder-Mails sind bereits in filteredMails gefiltert
	const currentFolderMails = filteredMails;

	// Ungelesene Mails zählen
	const unreadCount = currentFolderMails.filter((mail) => !mail.isRead).length;

	// Standard-Folder-Icons
	const getFolderIcon = (folderName: string) => {
		switch (folderName.toLowerCase()) {
			case 'inbox':
				return <Inbox className="w-4 h-4" />;
			case 'sent':
				return <Send className="w-4 h-4" />;
			case 'trash':
				return <Trash2 className="w-4 h-4" />;
			case 'archive':
				return <Archive className="w-4 h-4" />;
			default:
				return <MailIcon className="w-4 h-4" />;
		}
	};

	// Mail-Datum formatieren
	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat('de-DE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(new Date(date));
	};

	// Mail-Adressen formatieren
	const formatAddresses = (addresses: any[]) => {
		if (!addresses || addresses.length === 0) return '';

		return addresses
			.map((addr) => {
				if (typeof addr === 'string') {
					return addr;
				}
				if (addr.name && addr.address) {
					return `${addr.name} <${addr.address}>`;
				}
				return addr.address || addr.name || '';
			})
			.join(', ');
	};

	// Account-Sync
	const handleSync = async () => {
		if (selectedAccount) {
			await syncAccount(selectedAccount.id);
		}
	};

	// Mail-App in neuem Fenster öffnen
	const handleOpenMail = async () => {
		try {
			await window.electron.window.openMail();
		} catch {
			// Fehler beim Öffnen des Mail-Fensters
		}
	};

	return (
		<div className="flex h-full bg-background">
			{/* Sidebar - Accounts & Folders */}
			<div className="w-64 border-r border-border bg-card">
				<div className="p-4">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold">Mail</h2>
						<div className="flex gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={handleOpenMail}
								title="In neuem Fenster öffnen"
							>
								<MailIcon className="w-4 h-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleSync}
								disabled={isLoading}
							>
								<RefreshCw
									className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
								/>
							</Button>
						</div>
					</div>

					{/* Account Selection */}
					<div className="mb-4">
						<Select
							value={selectedAccount?.id || ''}
							onValueChange={(accountId) => {
								const account = accounts.find((a) => a.id === accountId);
								if (account) selectAccount(account.id);
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Account wählen" />
							</SelectTrigger>
							<SelectContent>
								{accounts.map((account) => (
									<SelectItem key={account.id} value={account.id}>
										{account.name} ({account.email})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Folders */}
					<div className="space-y-1">
						<h3 className="text-sm font-medium text-muted-foreground mb-2">
							Ordner
						</h3>
						<ScrollArea className="h-64">
							{folders
								.filter((folder) => folder.accountId === selectedAccount?.id)
								.map((folder) => {
									const folderMails = Array.from(store.mails.values()).filter(
										(m) =>
											m.folderId === folder.id &&
											m.accountId === selectedAccount?.id,
									);
									const unreadInFolder = folderMails.filter(
										(m) => !m.isRead,
									).length;

									return (
										<Button
											key={folder.id}
											variant={
												selectedFolder?.id === folder.id ? 'secondary' : 'ghost'
											}
											className="w-full justify-start h-auto p-2"
											onClick={() => selectFolder(folder.id)}
										>
											<div className="flex items-center justify-between w-full">
												<div className="flex items-center gap-2">
													{getFolderIcon(folder.name)}
													<span className="text-sm">{folder.name}</span>
												</div>
												{unreadInFolder > 0 && (
													<Badge variant="secondary" className="ml-auto">
														{unreadInFolder}
													</Badge>
												)}
											</div>
										</Button>
									);
								})}
						</ScrollArea>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 flex">
				{/* Mail List */}
				<div className="w-96 border-r border-border bg-card">
					<div className="p-4">
						<div className="flex items-center justify-between mb-4">
							<div>
								<h3 className="text-lg font-semibold">
									{selectedFolder?.name || 'Kein Ordner'}
								</h3>
								<p className="text-sm text-muted-foreground">
									{currentFolderMails.length} Nachrichten
									{unreadCount > 0 && ` (${unreadCount} ungelesen)`}
								</p>
							</div>
							<Button variant="ghost" size="sm">
								<Plus className="w-4 h-4" />
							</Button>
						</div>

						{error && (
							<div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
								{error}
							</div>
						)}

						<ScrollArea className="h-[calc(100vh-200px)]">
							<div className="space-y-2">
								{currentFolderMails.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground">
										<MailIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
										<p>Keine Nachrichten in diesem Ordner</p>
									</div>
								) : (
									currentFolderMails.map((mail) => (
										<Card
											key={mail.id}
											className={`cursor-pointer transition-colors hover:bg-accent ${
												!mail.isRead ? 'border-l-4 border-l-primary' : ''
											}`}
											onClick={() => handleOpenMail()}
										>
											<CardContent className="p-3">
												<div className="flex items-start gap-3">
													<div className="flex-1 min-w-0">
														<div className="flex items-center justify-between mb-1">
															<p
																className={`text-sm truncate ${
																	!mail.isRead ? 'font-semibold' : 'font-normal'
																}`}
															>
																{formatAddresses(mail.from)}
															</p>
															<span className="text-xs text-muted-foreground">
																{formatDate(mail.date)}
															</span>
														</div>
														<p
															className={`text-sm truncate mb-1 ${
																!mail.isRead ? 'font-medium' : 'font-normal'
															}`}
														>
															{mail.subject}
														</p>
														<p className="text-xs text-muted-foreground line-clamp-2">
															{mail.snippet ||
																mail.textContent?.substring(0, 100) ||
																'Keine Vorschau verfügbar'}
														</p>
													</div>
													<div className="flex flex-col items-end gap-1">
														{mail.isStarred && (
															<Star className="w-4 h-4 text-yellow-500 fill-current" />
														)}
														{mail.hasAttachments && (
															<div className="w-2 h-2 bg-blue-500 rounded-full" />
														)}
													</div>
												</div>
											</CardContent>
										</Card>
									))
								)}
							</div>
						</ScrollArea>
					</div>
				</div>

				{/* Mail Content */}
				<div className="flex-1 bg-background">
					{selectedMail ? (
						<div className="h-full flex flex-col">
							{/* Mail Header */}
							<div className="border-b border-border bg-card p-4">
								<div className="flex items-start justify-between mb-4">
									<div className="flex-1">
										<h1 className="text-xl font-semibold mb-2">
											{selectedMail.subject}
										</h1>
										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											<span>
												<strong>Von:</strong>{' '}
												{formatAddresses(selectedMail.from)}
											</span>
											<span>
												<strong>An:</strong> {formatAddresses(selectedMail.to)}
											</span>
											<span>
												<strong>Datum:</strong> {formatDate(selectedMail.date)}
											</span>
										</div>
										{selectedMail.cc && selectedMail.cc.length > 0 && (
											<div className="mt-1 text-sm text-muted-foreground">
												<strong>CC:</strong> {formatAddresses(selectedMail.cc)}
											</div>
										)}
									</div>
									<div className="flex items-center gap-2">
										<Button variant="ghost" size="sm">
											<Star
												className={`w-4 h-4 ${selectedMail.isStarred ? 'text-yellow-500 fill-current' : ''}`}
											/>
										</Button>
										<Button variant="ghost" size="sm">
											<Archive className="w-4 h-4" />
										</Button>
										<Button variant="ghost" size="sm">
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								</div>

								{selectedMail.hasAttachments && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<span>
											📎 {selectedMail.attachments?.length || 0} Anhang(e)
										</span>
									</div>
								)}
							</div>

							{/* Mail Body */}
							<ScrollArea className="flex-1 p-4">
								<div className="prose max-w-none">
									{selectedMail.body ? (
										<div className="text-sm leading-relaxed">
											{/* TODO: Sanitize HTML content before rendering */}
											<pre className="whitespace-pre-wrap">
												{selectedMail.textContent ||
													'Kein Textinhalt verfügbar'}
											</pre>
										</div>
									) : (
										<p className="text-muted-foreground">
											Nachrichteninhalt konnte nicht geladen werden.
										</p>
									)}
								</div>
							</ScrollArea>

							{/* Action Buttons */}
							<div className="border-t border-border bg-card p-4">
								<div className="flex gap-2">
									<Button variant="default" size="sm">
										Antworten
									</Button>
									<Button variant="outline" size="sm">
										Allen antworten
									</Button>
									<Button variant="outline" size="sm">
										Weiterleiten
									</Button>
								</div>
							</div>
						</div>
					) : (
						<div className="h-full flex items-center justify-center text-muted-foreground">
							<div className="text-center">
								<MailIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
								<p className="text-lg">Wählen Sie eine Nachricht aus</p>
								<p className="text-sm">
									Klicken Sie auf eine Nachricht in der Liste, um sie zu lesen
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
