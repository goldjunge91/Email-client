import { ElectronHandler } from '@/main/preload';
import type { Account } from '@/core/mail/imapClient';

declare global {
	interface Window {
		// Erweitert den bestehenden electron-Handler um unsere neue Funktion
		electron: ElectronHandler & {
			verifyAccount: (
				account: Account,
			) => Promise<{ success: boolean; error?: string }>;
		};
	}
}
