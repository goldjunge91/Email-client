/* eslint-disable no-console */
import React, { useState, useEffect, useCallback } from 'react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailAccount } from '@/types/mail';
import AccountForm from '@/ui/accounts/AccountForm';
import { Trash2 } from 'lucide-react';

export function SettingsAccounts() {
	const [accounts, setAccounts] = useState<MailAccount[]>([]);

	const fetchAccounts = useCallback(async () => {
		const result = await window.electron.mail.getAllAccounts();
		if (result.success) {
			setAccounts(result.data);
		} else {
			console.error('Failed to fetch accounts:', result.error);
		}
	}, []);

	useEffect(() => {
		fetchAccounts();
	}, [fetchAccounts]);

	const handleDeleteAccount = useCallback(
		async (accountId: number) => {
			const result = await window.electron.mail.removeAccount(accountId);
			if (result.success) {
				fetchAccounts(); // Refresh the list
			} else {
				console.error('Failed to delete account:', result.error);
			}
		},
		[fetchAccounts],
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>E-Mail Accounts</CardTitle>
				<CardDescription>
					Füge hier deine IMAP-Konten hinzu und verwalte sie.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<h2 className="text-lg font-semibold mb-4">Konto hinzufügen</h2>
				<AccountForm onSuccess={fetchAccounts} />

				<h2 className="text-lg font-semibold mt-8 mb-4">Verwaltete Konten</h2>
				{accounts.length === 0 ? (
					<p className="text-muted-foreground">
						Noch keine Konten hinzugefügt.
					</p>
				) : (
					<div className="space-y-4">
						{accounts.map((account) => (
							<Card
								key={account.id}
								className="p-4 flex items-center justify-between"
							>
								<div>
									<p className="font-medium">{account.name}</p>
									<p className="text-sm text-muted-foreground">
										{account.email}
									</p>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => handleDeleteAccount(account.id)}
								>
									<Trash2 className="h-4 w-4 text-red-500" />
								</Button>
							</Card>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
