import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import AccountForm from '@/ui/accounts/AccountForm';

export function SettingsAccounts() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>E-Mail Accounts</CardTitle>
				<CardDescription>
					Füge hier deine IMAP-Konten hinzu und verwalte sie.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{/* Test-Überschrift zur Sicherheit */}
				<h1>Account-Formular:</h1>
				<AccountForm />
			</CardContent>
		</Card>
	);
}
