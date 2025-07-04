import React, { useState } from 'react';
// Passe den Pfad ggf. an, falls 'Account' woanders liegt
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { Account } from '../../core/mail/imapClient';

function AccountForm() {
	const [status, setStatus] = useState<{
		loading: boolean;
		error: string | null;
		success: boolean;
	}>({
		loading: false,
		error: null,
		success: false,
	});

	const [server, setServer] = useState('');
	const [port, setPort] = useState(993);
	const [ssl, setSsl] = useState(true);
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setStatus({ loading: true, error: null, success: false });

		const accountData: Account = { server, port, ssl, username, password };

		// FIX 1: window.electron statt window.api verwenden
		const result = await window.electron.verifyAccount(accountData);

		if (result.success) {
			setStatus({ loading: false, error: null, success: true });
			// eslint-disable-next-line no-console
			console.log('Verbindung erfolgreich! Account kann gespeichert werden.');
		} else {
			setStatus({
				loading: false,
				error: result.error || 'Ein unbekannter Fehler ist aufgetreten.',
				success: false,
			});
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<div className="grid gap-2">
				<Label htmlFor="server">IMAP-Server</Label>
				<Input
					id="server"
					type="text"
					value={server}
					onChange={(e) => setServer(e.target.value)}
					required
				/>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="port">Port</Label>
				<Input
					id="port"
					type="number"
					value={port}
					onChange={(e) => setPort(Number(e.target.value))}
					required
				/>
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

			{/* FIX 2: Checkbox korrekt mit Label verknüpft */}
			<div className="flex items-center space-x-2">
				<Checkbox
					id="ssl"
					checked={ssl}
					onCheckedChange={(checked) => setSsl(Boolean(checked))}
				/>
				<Label
					htmlFor="ssl"
					className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					SSL/TLS verwenden
				</Label>
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
