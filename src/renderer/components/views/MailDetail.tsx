import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
	Mail as MailIcon,
	Star,
	Archive,
	Trash2,
	Reply,
	ReplyAll,
	Forward,
	ArrowLeft,
} from 'lucide-react';
import { Mail } from '@/types/mail';
import { useMailStoreContext } from '../../context/MailStoreProvider';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

export default function MailDetail() {
	const { mailId } = useParams<{ mailId: string }>();
	const { store } = useMailStoreContext();
	const [mail, setMail] = useState<Mail | null>(null);

	useEffect(() => {
		if (mailId && store.mails.has(mailId)) {
			setMail(store.mails.get(mailId) || null);
		}
	}, [mailId, store.mails]);

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

	const handleClose = () => {
		window.close();
	};

	if (!mail) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<MailIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
					<p className="text-lg">Mail nicht gefunden</p>
					<Button variant="outline" onClick={handleClose} className="mt-4">
						Fenster schließen
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col bg-background">
			{/* Header */}
			<div className="border-b border-border bg-card p-4">
				<div className="flex items-start justify-between mb-4">
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="sm" onClick={handleClose}>
							<ArrowLeft className="w-4 h-4" />
						</Button>
						<div className="flex-1">
							<h1 className="text-xl font-semibold mb-2">{mail.subject}</h1>
							<div className="flex flex-col gap-2 text-sm text-muted-foreground">
								<div className="flex items-center gap-4">
									<span>
										<strong>Von:</strong> {formatAddresses(mail.from)}
									</span>
									<span>
										<strong>Datum:</strong> {formatDate(mail.date)}
									</span>
								</div>
								<div>
									<strong>An:</strong> {formatAddresses(mail.to)}
								</div>
								{mail.cc && mail.cc.length > 0 && (
									<div>
										<strong>CC:</strong> {formatAddresses(mail.cc)}
									</div>
								)}
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="sm">
							<Star
								className={`w-4 h-4 ${
									mail.isStarred ? 'text-yellow-500 fill-current' : ''
								}`}
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

				{mail.hasAttachments && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<span>📎 {mail.attachments?.length || 0} Anhang(e)</span>
					</div>
				)}
			</div>

			{/* Mail Body */}
			<ScrollArea className="flex-1 p-6">
				<Card>
					<CardContent className="p-6">
						<div className="prose max-w-none">
							{mail.htmlContent ? (
								<div
									className="text-sm leading-relaxed"
									dangerouslySetInnerHTML={{ __html: mail.htmlContent }}
								/>
							) : (
								<pre className="whitespace-pre-wrap text-sm leading-relaxed">
									{mail.textContent || 'Kein Textinhalt verfügbar'}
								</pre>
							)}
						</div>
					</CardContent>
				</Card>
			</ScrollArea>

			{/* Action Buttons */}
			<div className="border-t border-border bg-card p-4">
				<div className="flex gap-2">
					<Button variant="default" size="sm">
						<Reply className="w-4 h-4 mr-2" />
						Antworten
					</Button>
					<Button variant="outline" size="sm">
						<ReplyAll className="w-4 h-4 mr-2" />
						Allen antworten
					</Button>
					<Button variant="outline" size="sm">
						<Forward className="w-4 h-4 mr-2" />
						Weiterleiten
					</Button>
				</div>
			</div>
		</div>
	);
}
