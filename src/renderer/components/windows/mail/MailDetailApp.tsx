/* eslint-disable no-nested-ternary */
/* eslint-disable no-console */
/* eslint-disable react/no-danger */
import React, { useEffect, useState } from 'react';
import {
	Mail as MailIcon,
	Star,
	Archive,
	Trash2,
	Reply,
	ReplyAll,
	Forward,
	ArrowLeft,
	Paperclip,
} from 'lucide-react';
import { Mail } from '@/types/mail';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { useMailStoreContext } from '../../../context/MailStoreProvider';

export default function MailDetailApp() {
	const { store } = useMailStoreContext();
	const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Listen for mail ID from main process
		const handleSetMailId = (mailId: string) => {
			const mail = store.mails.get(mailId);
			if (mail) {
				setSelectedMail(mail);
			}
			setIsLoading(false);
		};

		// Add IPC listener for mail ID
		const cleanup = window.electron.window.onMailIdSet(handleSetMailId);

		// Cleanup
		return cleanup;
	}, [store.mails]);

	// Mail-Datum formatieren
	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat('de-DE', {
			year: 'numeric',
			month: 'long',
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

	// Fenster schließen
	const handleClose = () => {
		window.close();
	};

	// Mail-Aktionen
	const handleStarToggle = async () => {
		if (selectedMail) {
			await window.electron.mail.markAsStarred(selectedMail.id);
			// Update local state
			setSelectedMail({
				...selectedMail,
				isStarred: !selectedMail.isStarred,
			});
		}
	};

	const handleArchive = async () => {
		if (selectedMail) {
			// TODO: Implement archive functionality
			console.log('Archive mail:', selectedMail.id);
		}
	};

	const handleDelete = async () => {
		if (selectedMail) {
			await window.electron.mail.deleteMail(selectedMail.id);
			handleClose();
		}
	};

	const handleReply = () => {
		// TODO: Implement reply functionality
		console.log('Reply to mail:', selectedMail?.id);
	};

	const handleReplyAll = () => {
		// TODO: Implement reply all functionality
		console.log('Reply all to mail:', selectedMail?.id);
	};

	const handleForward = () => {
		// TODO: Implement forward functionality
		console.log('Forward mail:', selectedMail?.id);
	};

	if (isLoading) {
		return (
			<div className="h-screen flex items-center justify-center">
				<div className="text-center">
					<MailIcon className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse" />
					<p className="text-lg">Nachricht wird geladen...</p>
				</div>
			</div>
		);
	}

	if (!selectedMail) {
		return (
			<div className="h-screen flex items-center justify-center">
				<div className="text-center">
					<MailIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
					<p className="text-lg">Nachricht nicht gefunden</p>
					<Button onClick={handleClose} className="mt-4">
						Fenster schließen
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="h-screen bg-background flex flex-col">
			{/* Header mit Aktionen */}
			<div className="border-b border-border bg-card p-4 flex-shrink-0">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleClose}
							className="flex items-center gap-2"
						>
							<ArrowLeft className="w-4 h-4" />
							Zurück
						</Button>
						<Separator orientation="vertical" className="h-6" />
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={handleStarToggle}
								className="flex items-center gap-2"
							>
								<Star
									className={`w-4 h-4 ${
										selectedMail.isStarred ? 'text-yellow-500 fill-current' : ''
									}`}
								/>
								{selectedMail.isStarred ? 'Favorit entfernen' : 'Favorisieren'}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleArchive}
								className="flex items-center gap-2"
							>
								<Archive className="w-4 h-4" />
								Archivieren
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleDelete}
								className="flex items-center gap-2 text-destructive hover:text-destructive"
							>
								<Trash2 className="w-4 h-4" />
								Löschen
							</Button>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="default"
							size="sm"
							onClick={handleReply}
							className="flex items-center gap-2"
						>
							<Reply className="w-4 h-4" />
							Antworten
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={handleReplyAll}
							className="flex items-center gap-2"
						>
							<ReplyAll className="w-4 h-4" />
							Allen antworten
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={handleForward}
							className="flex items-center gap-2"
						>
							<Forward className="w-4 h-4" />
							Weiterleiten
						</Button>
					</div>
				</div>
			</div>

			{/* Mail-Inhalt */}
			<div className="flex-1 overflow-hidden">
				<ScrollArea className="h-full">
					<div className="p-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-2xl mb-4">
									{selectedMail.subject}
								</CardTitle>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium">Von:</span>
												<span className="text-sm">
													{formatAddresses(selectedMail.from)}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium">Datum:</span>
												<span className="text-sm text-muted-foreground">
													{formatDate(selectedMail.date)}
												</span>
											</div>
										</div>
										<div className="flex items-center gap-2">
											{!selectedMail.isRead && (
												<Badge variant="secondary">Ungelesen</Badge>
											)}
											{selectedMail.isStarred && (
												<Star className="w-4 h-4 text-yellow-500 fill-current" />
											)}
										</div>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium">An:</span>
										<span className="text-sm">
											{formatAddresses(selectedMail.to)}
										</span>
									</div>
									{selectedMail.cc && selectedMail.cc.length > 0 && (
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium">CC:</span>
											<span className="text-sm">
												{formatAddresses(selectedMail.cc)}
											</span>
										</div>
									)}
									{selectedMail.bcc && selectedMail.bcc.length > 0 && (
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium">BCC:</span>
											<span className="text-sm">
												{formatAddresses(selectedMail.bcc)}
											</span>
										</div>
									)}
									{selectedMail.hasAttachments && (
										<div className="flex items-center gap-2">
											<Paperclip className="w-4 h-4" />
											<span className="text-sm font-medium">
												{selectedMail.attachments?.length || 0} Anhang(e)
											</span>
										</div>
									)}
								</div>
							</CardHeader>
							<CardContent>
								<Separator className="mb-6" />
								<div className="prose max-w-none">
									{selectedMail.body ? (
										<div
											className="text-sm leading-relaxed"
											dangerouslySetInnerHTML={{ __html: selectedMail.body }}
										/>
									) : selectedMail.textContent ? (
										<div className="text-sm leading-relaxed whitespace-pre-wrap">
											{selectedMail.textContent}
										</div>
									) : (
										<p className="text-muted-foreground">
											Nachrichteninhalt konnte nicht geladen werden.
										</p>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				</ScrollArea>
			</div>
		</div>
	);
}
