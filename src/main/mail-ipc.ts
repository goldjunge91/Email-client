import { ipcMain } from 'electron';
import { mailService } from './database/services/mailService';
/* eslint-disable import/no-extraneous-dependencies */
import { ImapClient } from '../core/mail/imapClient';
import { SmtpClient } from '../core/mail/smtpClient';
import { ruleEngine } from '../core/rules/ruleEngine';
// import { mailService } from '../database/services/mailService';
import { MailAccount, MailRule } from '../types/mail';

// Import windows from the main process
// import windows from './windows';

// Store active IMAP/SMTP clients
const imapClients = new Map<string, ImapClient>();
const smtpClients = new Map<string, SmtpClient>();

export const initializeMailIpc = () => {
	// Account Management
	ipcMain.handle('mail:add-account', async (_event, account: MailAccount) => {
		try {
			await mailService.addAccount(account);
			return { success: true, data: account };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	});

	ipcMain.handle('mail:remove-account', async (_event, accountId: string) => {
		try {
			// Disconnect clients
			const imapClient = imapClients.get(accountId);
			const smtpClient = smtpClients.get(accountId);

			if (imapClient) {
				imapClient.disconnect();
				imapClients.delete(accountId);
			}

			if (smtpClient) {
				smtpClient.disconnect();
				smtpClients.delete(accountId);
			}

			await mailService.removeAccount(accountId);
			return { success: true };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	});

	ipcMain.handle(
		'mail:update-account',
		async (_event, accountId: string, updates: Partial<MailAccount>) => {
			try {
				await mailService.updateAccount(accountId, updates);
				return { success: true };
			} catch (error) {
				return { success: false, error: (error as Error).message };
			}
		},
	);

	// Connection Management
	ipcMain.handle('mail:connect-account', async (_event, accountId: string) => {
		try {
			const account = await mailService.getAccount(accountId);
			if (!account) {
				throw new Error('Account not found');
			}

			// Create and connect IMAP client
			const imapClient = new ImapClient(accountId);
			await imapClient.connect({
				user: account.settings.incomingServer.auth.user,
				password: account.settings.incomingServer.auth.pass,
				host: account.settings.incomingServer.host,
				port: account.settings.incomingServer.port,
				tls: account.settings.incomingServer.secure,
			});
			imapClients.set(accountId, imapClient);

			// Create and connect SMTP client
			const smtpClient = new SmtpClient(accountId);
			await smtpClient.connect(
				{
					host: account.settings.outgoingServer.host,
					port: account.settings.outgoingServer.port,
					secure: account.settings.outgoingServer.secure,
					auth: {
						user: account.settings.outgoingServer.auth.user,
						pass: account.settings.outgoingServer.auth.pass,
					},
				},
				{
					name: account.name,
					address: account.email,
				},
			);
			smtpClients.set(accountId, smtpClient);

			return { success: true };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	});

	ipcMain.handle(
		'mail:disconnect-account',
		async (_event, accountId: string) => {
			try {
				const imapClient = imapClients.get(accountId);
				const smtpClient = smtpClients.get(accountId);

				if (imapClient) {
					imapClient.disconnect();
					imapClients.delete(accountId);
				}

				if (smtpClient) {
					smtpClient.disconnect();
					smtpClients.delete(accountId);
				}

				return { success: true };
			} catch (error) {
				return { success: false, error: (error as Error).message };
			}
		},
	);

	// Folder Operations
	ipcMain.handle('mail:get-folders', async (_event, accountId: string) => {
		try {
			const imapClient = imapClients.get(accountId);
			if (!imapClient || !imapClient.isReady()) {
				throw new Error('IMAP client not connected');
			}

			const folders = await imapClient.getFolders();
			return { success: true, data: folders };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	});

	// Mail Operations
	ipcMain.handle(
		'mail:fetch-mails',
		async (_event, accountId: string, folderId: string, options?: any) => {
			try {
				const imapClient = imapClients.get(accountId);
				if (!imapClient || !imapClient.isReady()) {
					throw new Error('IMAP client not connected');
				}

				const mails = await imapClient.fetchMails(folderId, options);
				return { success: true, data: mails };
			} catch (error) {
				return { success: false, error: (error as Error).message };
			}
		},
	);

	ipcMain.handle(
		'mail:mark-as-read',
		async (_event, accountId: string, mailId: string, read: boolean) => {
			try {
				await mailService.markAsRead(mailId, read);
				return { success: true };
			} catch (error) {
				return { success: false, error: (error as Error).message };
			}
		},
	);

	ipcMain.handle(
		'mail:mark-as-starred',
		async (_event, accountId: string, mailId: string, starred: boolean) => {
			try {
				await mailService.markAsStarred(mailId, starred);
				return { success: true };
			} catch (error) {
				return { success: false, error: (error as Error).message };
			}
		},
	);

	ipcMain.handle(
		'mail:move-mail',
		async (
			_event,
			accountId: string,
			mailId: string,
			targetFolderId: string,
		) => {
			try {
				await mailService.moveMail(mailId, targetFolderId);
				return { success: true };
			} catch (error) {
				return { success: false, error: (error as Error).message };
			}
		},
	);

	ipcMain.handle(
		'mail:delete-mail',
		async (_event, accountId: string, mailId: string) => {
			try {
				await mailService.deleteMail(mailId);
				return { success: true };
			} catch (error) {
				return { success: false, error: (error as Error).message };
			}
		},
	);

	// Send Mail
	ipcMain.handle(
		'mail:send-mail',
		async (_event, accountId: string, mailOptions: any) => {
			try {
				const smtpClient = smtpClients.get(accountId);
				if (!smtpClient) {
					throw new Error('SMTP client not connected');
				}

				const messageId = await smtpClient.sendMail(mailOptions);
				return { success: true, data: messageId };
			} catch (error) {
				return { success: false, error: (error as Error).message };
			}
		},
	);

	// Sync Operations
	ipcMain.handle('mail:sync-account', async (_event, accountId: string) => {
		try {
			const imapClient = imapClients.get(accountId);
			if (!imapClient || !imapClient.isReady()) {
				throw new Error('IMAP client not connected');
			}

			await mailService.syncAccount(accountId);
			return { success: true };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	});

	ipcMain.handle(
		'mail:sync-folder',
		async (_event, accountId: string, folderId: string) => {
			try {
				await mailService.syncFolder(folderId);
				return { success: true };
			} catch (error) {
				return { success: false, error: (error as Error).message };
			}
		},
	);

	// Search
	ipcMain.handle(
		'mail:search',
		async (_event, query: string, options?: any) => {
			try {
				const results = await mailService.searchMails(query, options);
				return { success: true, data: results };
			} catch (error) {
				return { success: false, error: (error as Error).message };
			}
		},
	);

	// Rules
	ipcMain.handle('mail:add-rule', async (_event, rule: MailRule) => {
		try {
			ruleEngine.addRule(rule);
			return { success: true };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	});

	ipcMain.handle(
		'mail:update-rule',
		async (_event, ruleId: string, updates: Partial<MailRule>) => {
			try {
				ruleEngine.updateRule(ruleId, updates);
				return { success: true };
			} catch (error) {
				return { success: false, error: (error as Error).message };
			}
		},
	);

	ipcMain.handle('mail:remove-rule', async (_event, ruleId: string) => {
		try {
			ruleEngine.removeRule(ruleId);
			return { success: true };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	});

	ipcMain.handle('mail:get-rules', async () => {
		try {
			const rules = ruleEngine.getRules();
			return { success: true, data: rules };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	});

	ipcMain.handle('mail:apply-rules', async (_event, mailId: string) => {
		try {
			const mail = await mailService.getMail(mailId);
			if (!mail) {
				throw new Error('Mail not found');
			}

			const actions = await ruleEngine.applyRules(mail);
			return { success: true, data: actions };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	});

	// Export/Import
	ipcMain.handle('mail:export-rules', async () => {
		try {
			const rulesJson = ruleEngine.exportRules();
			return { success: true, data: rulesJson };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	});

	ipcMain.handle('mail:import-rules', async (_event, rulesJson: string) => {
		try {
			ruleEngine.importRules(rulesJson);
			return { success: true };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	});

	// // Mail Service Event Forwarding
	// mailService.on('account:added', (account) => {
	// 	windows.mainWindow?.webContents.send('mail:account-added', account);
	// });

	// mailService.on('account:removed', (accountId) => {
	// 	windows.mainWindow?.webContents.send('mail:account-removed', accountId);
	// });

	// mailService.on('sync:started', (accountId) => {
	// 	windows.mainWindow?.webContents.send('mail:sync-started', accountId);
	// });

	// mailService.on('sync:progress', (progress) => {
	// 	windows.mainWindow?.webContents.send('mail:sync-progress', progress);
	// });

	// mailService.on('sync:completed', (accountId) => {
	// 	windows.mainWindow?.webContents.send('mail:sync-completed', accountId);
	// });

	// mailService.on('mails:added', (mails) => {
	// 	windows.mainWindow?.webContents.send('mail:mails-added', mails);
	// });

	// mailService.on('mails:updated', (mailIds) => {
	// 	windows.mainWindow?.webContents.send('mail:mails-updated', mailIds);
	// });

	// mailService.on('error', (error) => {
	// 	windows.mainWindow?.webContents.send('mail:error', error);
	// });
};
