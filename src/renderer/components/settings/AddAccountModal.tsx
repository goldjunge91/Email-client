import React, { useState } from 'react';
import { Button } from '@/renderer/components/ui/button';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/renderer/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/renderer/components/ui/select';
import { Checkbox } from '@/renderer/components/ui/checkbox';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import type { MailAccount } from '@/renderer/utils/mailService';
import { mailService } from '@/renderer/utils/mailService';

interface AccountFormData {
	email: string;
	password: string;
	displayName: string;
	imapHost: string;
	imapPort: number;
	imapSecurity: 'none' | 'tls' | 'ssl';
	smtpHost: string;
	smtpPort: number;
	smtpSecurity: 'none' | 'tls' | 'ssl';
}

interface AddAccountModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAccountAdded?: (account: MailAccount) => void;
	userId: number;
}

const commonProviders = [
	{
		name: 'Gmail',
		domain: 'gmail.com',
		imap: { host: 'imap.gmail.com', port: 993, security: 'ssl' as const },
		smtp: { host: 'smtp.gmail.com', port: 587, security: 'tls' as const },
	},
	{
		name: 'Outlook',
		domain: 'outlook.com',
		imap: {
			host: 'imap-mail.outlook.com',
			port: 993,
			security: 'ssl' as const,
		},
		smtp: {
			host: 'smtp-mail.outlook.com',
			port: 587,
			security: 'tls' as const,
		},
	},
	{
		name: 'Yahoo',
		domain: 'yahoo.com',
		imap: { host: 'imap.mail.yahoo.com', port: 993, security: 'ssl' as const },
		smtp: { host: 'smtp.mail.yahoo.com', port: 587, security: 'tls' as const },
	},
	{
		name: 'iCloud',
		domain: 'icloud.com',
		imap: { host: 'imap.mail.me.com', port: 993, security: 'ssl' as const },
		smtp: { host: 'smtp.mail.me.com', port: 587, security: 'tls' as const },
	},
];

export function AddAccountModal({
	open,
	onOpenChange,
	onAccountAdded,
	userId,
}: AddAccountModalProps) {
	const [formData, setFormData] = useState<AccountFormData>({
		email: '',
		password: '',
		displayName: '',
		imapHost: '',
		imapPort: 993,
		imapSecurity: 'ssl',
		smtpHost: '',
		smtpPort: 587,
		smtpSecurity: 'tls',
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [useAdvancedSettings, setUseAdvancedSettings] = useState(false);

	const handleEmailChange = (email: string) => {
		setFormData((prev) => ({ ...prev, email }));

		// Auto-configure based on common providers
		const domain = email.split('@')[1]?.toLowerCase();
		const provider = commonProviders.find((p) => p.domain === domain);

		if (provider && !useAdvancedSettings) {
			setFormData((prev) => ({
				...prev,
				email,
				imapHost: provider.imap.host,
				imapPort: provider.imap.port,
				imapSecurity: provider.imap.security,
				smtpHost: provider.smtp.host,
				smtpPort: provider.smtp.port,
				smtpSecurity: provider.smtp.security,
			}));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');

		try {
			const account = await mailService.createAccount({
				user_id: userId,
				email: formData.email,
				password: formData.password, // In production, this should be encrypted
				display_name: formData.displayName || formData.email,
				imap_host: formData.imapHost,
				imap_port: formData.imapPort,
				imap_security: formData.imapSecurity,
				smtp_host: formData.smtpHost,
				smtp_port: formData.smtpPort,
				smtp_security: formData.smtpSecurity,
				is_active: true,
			});

			onAccountAdded?.(account);
			onOpenChange(false);

			// Reset form
			setFormData({
				email: '',
				password: '',
				displayName: '',
				imapHost: '',
				imapPort: 993,
				imapSecurity: 'ssl',
				smtpHost: '',
				smtpPort: 587,
				smtpSecurity: 'tls',
			});
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten',
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Neues E-Mail-Konto hinzufügen</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="space-y-2">
						<Label htmlFor="email">E-Mail-Adresse</Label>
						<Input
							id="email"
							type="email"
							value={formData.email}
							onChange={(e) => handleEmailChange(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="password">Passwort</Label>
						<Input
							id="password"
							type="password"
							value={formData.password}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, password: e.target.value }))
							}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="displayName">Anzeigename (optional)</Label>
						<Input
							id="displayName"
							value={formData.displayName}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									displayName: e.target.value,
								}))
							}
							placeholder={formData.email}
						/>
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							id="advanced"
							checked={useAdvancedSettings}
							onCheckedChange={setUseAdvancedSettings}
						/>
						<Label htmlFor="advanced">Erweiterte Einstellungen</Label>
					</div>

					{useAdvancedSettings && (
						<div className="space-y-4 p-4 border rounded-lg">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="imapHost">IMAP Server</Label>
									<Input
										id="imapHost"
										value={formData.imapHost}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												imapHost: e.target.value,
											}))
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="imapPort">IMAP Port</Label>
									<Input
										id="imapPort"
										type="number"
										value={formData.imapPort}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												imapPort: parseInt(e.target.value, 10),
											}))
										}
										required
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="imapSecurity">IMAP Sicherheit</Label>
								<Select
									value={formData.imapSecurity}
									onValueChange={(value: 'none' | 'tls' | 'ssl') =>
										setFormData((prev) => ({ ...prev, imapSecurity: value }))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Keine</SelectItem>
										<SelectItem value="tls">TLS/STARTTLS</SelectItem>
										<SelectItem value="ssl">SSL</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="smtpHost">SMTP Server</Label>
									<Input
										id="smtpHost"
										value={formData.smtpHost}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												smtpHost: e.target.value,
											}))
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="smtpPort">SMTP Port</Label>
									<Input
										id="smtpPort"
										type="number"
										value={formData.smtpPort}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												smtpPort: parseInt(e.target.value, 10),
											}))
										}
										required
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="smtpSecurity">SMTP Sicherheit</Label>
								<Select
									value={formData.smtpSecurity}
									onValueChange={(value: 'none' | 'tls' | 'ssl') =>
										setFormData((prev) => ({ ...prev, smtpSecurity: value }))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Keine</SelectItem>
										<SelectItem value="tls">TLS/STARTTLS</SelectItem>
										<SelectItem value="ssl">SSL</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Abbrechen
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Konto hinzufügen
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
