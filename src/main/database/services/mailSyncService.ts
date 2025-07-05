/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */
import { ImapClient } from '../../core/mail/imapClient';
import { mailService } from './mailService';
import type { MailAccount, MailFolder } from '../../types/mail';

export class MailSyncService {
	// eslint-disable-next-line no-use-before-define
	private static instance: MailSyncService;

	private syncInProgress = new Set<number>();

	public static getInstance(): MailSyncService {
		if (!MailSyncService.instance) {
			MailSyncService.instance = new MailSyncService();
		}
		return MailSyncService.instance;
	}

	/**
	 * Account komplett synchronisieren
	 */
	async syncAccount(accountId: number): Promise<void> {
		if (this.syncInProgress.has(accountId)) {
			console.log(`Sync für Account ${accountId} bereits in Bearbeitung`);
			return;
		}

		this.syncInProgress.add(accountId);

		try {
			console.log(`🔄 Starte Sync für Account ${accountId}`);

			// Account aus Datenbank laden
			const account = await mailService.getAccountById(accountId);
			if (!account) {
				throw new Error(`Account ${accountId} nicht gefunden`);
			}

			// IMAP-Client erstellen und verbinden
			const imapClient = new ImapClient(accountId.toString());
			await imapClient.connect({
				user: account.username,
				password: account.password,
				host: account.imap_host,
				port: account.imap_port,
				tls: account.imap_secure,
			});

			// Sync-Status aktualisieren
			await mailService.updateAccount(accountId, {
				sync_status: 'syncing',
				sync_error: null,
			});

			// 1. Ordner synchronisieren
			await this.syncFolders(account, imapClient);

			// 2. E-Mails in allen Ordnern synchronisieren
			const folders = await mailService.getFoldersByAccount(accountId);
			const selectableFolders = folders.filter(
				(folder) => folder.is_selectable,
			);

			for (const folder of selectableFolders) {
				// eslint-disable-next-line no-await-in-loop
				await this.syncFolderMails(account, folder, imapClient);
			}

			// Sync abgeschlossen
			await mailService.updateAccount(accountId, {
				sync_status: 'idle',
				last_sync_date: new Date(),
				sync_error: null,
			});

			await imapClient.disconnect();

			console.log(`✅ Sync für Account ${accountId} abgeschlossen`);
		} catch (error) {
			console.error(`❌ Sync-Fehler für Account ${accountId}:`, error);

			// Fehler in Datenbank speichern
			await mailService.updateAccount(accountId, {
				sync_status: 'error',
				sync_error:
					error instanceof Error ? error.message : 'Unbekannter Fehler',
			});

			throw error;
		} finally {
			this.syncInProgress.delete(accountId);
		}
	}

	/**
	 * Ordner-Struktur synchronisieren
	 */
	private async syncFolders(
		account: MailAccount,
		imapClient: ImapClient,
	): Promise<void> {
		console.log(`📁 Synchronisiere Ordner für Account ${account.id}`);

		try {
			// Ordner vom IMAP-Server abrufen
			const remoteFolders = await imapClient.getFolders();

			// Bestehende Ordner aus Datenbank laden
			const localFolders = await mailService.getFoldersByAccount(account.id);
			const localFolderPaths = new Set(localFolders.map((f) => f.path));

			// Neue Ordner erstellen
			for (const remoteFolder of remoteFolders) {
				if (!localFolderPaths.has(remoteFolder.path)) {
					await mailService.createFolder({
						account_id: account.id,
						name: remoteFolder.name,
						display_name: remoteFolder.displayName || remoteFolder.name,
						type: remoteFolder.type || 'custom',
						path: remoteFolder.path,
						delimiter: remoteFolder.delimiter || '/',
						is_selectable: remoteFolder.selectable !== false,
						has_children: remoteFolder.hasChildren || false,
						unread_count: 0,
						total_count: 0,
					});
					console.log(`📁 Neuer Ordner erstellt: ${remoteFolder.path}`);
				}
			}
		} catch (error) {
			console.error('Fehler beim Synchronisieren der Ordner:', error);
			throw error;
		}
	}

	/**
	 * E-Mails eines Ordners synchronisieren
	 */
	private async syncFolderMails(
		account: MailAccount,
		folder: MailFolder,
		imapClient: ImapClient,
	): Promise<void> {
		console.log(`📧 Synchronisiere E-Mails für Ordner ${folder.path}`);

		try {
			// Letzten Sync-Status für diesen Ordner abrufen
			const lastSync = await mailService.getLastSyncStatus(
				account.id,
				folder.id,
			);
			const sinceUid = lastSync?.last_uid;

			// E-Mails vom IMAP-Server abrufen
			const remoteMails = await imapClient.fetchEmailsToDatabase(
				folder.path,
				folder.id,
				100, // Maximal 100 E-Mails pro Sync
				sinceUid,
			);

			let processedCount = 0;
			let addedCount = 0;
			let updatedCount = 0;
			let lastUid = sinceUid || 0;

			// E-Mails in Datenbank speichern
			for (const mail of remoteMails) {
				try {
					// Prüfen ob E-Mail bereits existiert (basierend auf UID)
					const existingMails = await mailService.getMailsByFolder(
						folder.id,
						1000,
					);
					const existingMail = existingMails.find((m) => m.uid === mail.uid);

					if (existingMail) {
						// E-Mail aktualisieren falls nötig
						updatedCount++;
					} else {
						// Neue E-Mail erstellen
						await mailService.createMail(mail);
						addedCount++;
					}

					processedCount++;
					lastUid = Math.max(lastUid, mail.uid);
				} catch (mailError) {
					console.error(
						`Fehler beim Verarbeiten der E-Mail ${mail.message_id}:`,
						mailError,
					);
				}
			}

			// Sync-Status aktualisieren
			await mailService.updateSyncStatus({
				account_id: account.id,
				folder_id: folder.id,
				last_sync_date: new Date(),
				last_uid: lastUid,
				sync_type: 'full',
				status: 'completed',
				emails_processed: processedCount,
				emails_added: addedCount,
				emails_updated: updatedCount,
				error_message: null,
			});

			// Ordner-Statistiken aktualisieren
			const allFolderMails = await mailService.getMailsByFolder(
				folder.id,
				10000,
			);
			const unreadCount = allFolderMails.filter((m) => !m.is_read).length;
			await mailService.updateFolderCounts(
				folder.id,
				unreadCount,
				allFolderMails.length,
			);

			console.log(
				`✅ Ordner ${folder.path}: ${addedCount} neue, ${updatedCount} aktualisiert`,
			);
		} catch (error) {
			console.error(
				`Fehler beim Synchronisieren des Ordners ${folder.path}:`,
				error,
			);

			// Fehler-Status speichern
			await mailService.updateSyncStatus({
				account_id: account.id,
				folder_id: folder.id,
				last_sync_date: new Date(),
				sync_type: 'full',
				status: 'error',
				error_message:
					error instanceof Error ? error.message : 'Unbekannter Fehler',
				emails_processed: 0,
				emails_added: 0,
				emails_updated: 0,
			});
		}
	}

	/**
	 * Account-Verbindung testen
	 */
	async testAccountConnection(account: MailAccount): Promise<boolean> {
		try {
			const imapClient = new ImapClient(account.id.toString());
			await imapClient.connect({
				user: account.username,
				password: account.password,
				host: account.imap_host,
				port: account.imap_port,
				tls: account.imap_secure,
			});
			await imapClient.disconnect();
			return true;
		} catch (error) {
			console.error('Verbindungstest fehlgeschlagen:', error);
			return false;
		}
	}

	/**
	 * Nur neuen E-Mails synchronisieren (Incremental Sync)
	 */
	async syncNewMails(accountId: number, folderId?: number): Promise<void> {
		if (this.syncInProgress.has(accountId)) {
			console.log(`Sync für Account ${accountId} bereits in Bearbeitung`);
			return;
		}

		this.syncInProgress.add(accountId);

		try {
			const account = await mailService.getAccountById(accountId);
			if (!account) {
				throw new Error(`Account ${accountId} nicht gefunden`);
			}

			const imapClient = new ImapClient(accountId.toString());
			await imapClient.connect({
				user: account.username,
				password: account.password,
				host: account.imap_host,
				port: account.imap_port,
				tls: account.imap_secure,
			});

			if (folderId) {
				// Nur spezifischen Ordner synchronisieren
				const folder = await mailService
					.getFoldersByAccount(accountId)
					.then((folders) => folders.find((f) => f.id === folderId));
				if (folder) {
					await this.syncFolderMails(account, folder, imapClient);
				}
			} else {
				// Alle Ordner synchronisieren
				const folders = await mailService.getFoldersByAccount(accountId);
				for (const folder of folders) {
					if (folder.is_selectable) {
						await this.syncFolderMails(account, folder, imapClient);
					}
				}
			}

			await imapClient.disconnect();
		} finally {
			this.syncInProgress.delete(accountId);
		}
	}
}

// Singleton Export
export const mailSyncService = MailSyncService.getInstance();
