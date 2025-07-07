/* eslint-disable no-console */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { NewMailAccount } from '../../types/mail';

function AccountForm({ onSuccess }: { onSuccess?: () => void }) {
	const [status, setStatus] = useState<{
		loading: boolean;
		error: string | null;
		success: boolean;
	}>({
		loading: false,
		error: null,
		success: false,
	});
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [imapHost, setImapHost] = useState('');
	const [imapPort, setImapPort] = useState(993);
	const [imapSecure, setImapSecure] = useState(true);
	const [smtpHost, setSmtpHost] = useState('');
	const [smtpPort, setSmtpPort] = useState(587);
	const [smtpSecure, setSmtpSecure] = useState(true);
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setStatus({ loading: true, error: null, success: false });

		const accountData: Omit<
			NewMailAccount,
			| 'id'
			| 'createdAt'
			| 'updatedAt'
			| 'lastSyncDate'
			| 'syncStatus'
			| 'syncError'
		> = {
			userId: 1, // Placeholder for now
			name,
			email,
			provider: 'custom', // Assuming custom for now
			imapHost,
			imapPort,
			imapSecure,
			smtpHost,
			smtpPort,
			smtpSecure,
			username,
			password,
			isActive: true,
		};

		try {
			// Verify IMAP connection
			const imapVerifyResult = await window.electron.mail.verifyImapConnection({
				user: username,
				password,
				host: imapHost,
				port: imapPort,
				tls: imapSecure,
			});

			if (!imapVerifyResult.success) {
				setStatus({
					loading: false,
					error: imapVerifyResult.error || 'IMAP-Verbindung fehlgeschlagen.',
					success: false,
				});
				return;
			}

			// Verify SMTP connection
			const smtpVerifyResult = await window.electron.mail.verifySmtpConnection({
				host: smtpHost,
				port: smtpPort,
				secure: smtpSecure,
				auth: {
					user: username,
					pass: password,
				},
			});

			if (!smtpVerifyResult.success) {
				setStatus({
					loading: false,
					error: smtpVerifyResult.error || 'SMTP-Verbindung fehlgeschlagen.',
					success: false,
				});
				return;
			}

			// Save account to database
			const saveResult = await window.electron.mail.addAccount(accountData);

			if (saveResult.success) {
				setStatus({ loading: false, error: null, success: true });
				console.log('Konto erfolgreich hinzugefügt und verifiziert!');
				onSuccess?.(); // Call onSuccess callback
				// Optionally clear form or redirect
			} else {
				setStatus({
					loading: false,
					error: saveResult.error || 'Fehler beim Speichern des Kontos.',
					success: false,
				});
			}
		} catch (error: any) {
			setStatus({
				loading: false,
				error: error.message || 'Ein unbekannter Fehler ist aufgetreten.',
				success: false,
			});
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<div className="grid gap-2">
				<Label htmlFor="name">Kontoname</Label>
				<Input
					id="name"
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="email">E-Mail Adresse</Label>
				<Input
					id="email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="imapHost">IMAP-Server</Label>
				<Input
					id="imapHost"
					type="text"
					value={imapHost}
					onChange={(e) => setImapHost(e.target.value)}
					required
				/>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="imapPort">IMAP-Port</Label>
				<Input
					id="imapPort"
					type="number"
					value={imapPort}
					onChange={(e) => setImapPort(Number(e.target.value))}
					required
				/>
			</div>

			<div className="flex items-center space-x-2">
				<Checkbox
					id="imapSecure"
					checked={imapSecure}
					onCheckedChange={(checked) => setImapSecure(Boolean(checked))}
				/>
				<Label
					htmlFor="imapSecure"
					className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					IMAP SSL/TLS verwenden
				</Label>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="smtpHost">SMTP-Server</Label>
				<Input
					id="smtpHost"
					type="text"
					value={smtpHost}
					onChange={(e) => setSmtpHost(e.target.value)}
					required
				/>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="smtpPort">SMTP-Port</Label>
				<Input
					id="smtpPort"
					type="number"
					value={smtpPort}
					onChange={(e) => setSmtpPort(Number(e.target.value))}
					required
				/>
			</div>

			<div className="flex items-center space-x-2">
				<Checkbox
					id="smtpSecure"
					checked={smtpSecure}
					onCheckedChange={(checked) => setSmtpSecure(Boolean(checked))}
				/>
				<Label
					htmlFor="smtpSecure"
					className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					SMTP SSL/TLS verwenden
				</Label>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="username">Benutzername</Label>
				<Input
					id="username"
					type="text"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					required
				/>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="password">Passwort</Label>
				<Input
					id="password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</div>

			<Button type="submit" disabled={status.loading}>
				{status.loading
					? 'Verbindung wird geprüft...'
					: 'Konto hinzufügen & verifizieren'}
			</Button>

			{status.success && (
				<p className="text-sm text-green-600">✅ Verbindung erfolgreich!</p>
			)}
			{status.error && (
				<p className="text-sm text-red-600">❌ Fehler: {status.error}</p>
			)}
		</form>
	);
}

export default AccountForm;
