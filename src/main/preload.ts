import { $errors } from '@/config/strings';
import { NotificationOptions } from '@/types/notification';
import { getOS } from '@/utils/getOS';
// eslint-disable-next-line import/no-extraneous-dependencies
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { ipcChannels } from '../config/ipc-channels';
import { SettingsType } from '../config/settings';
import { MailAccount, Mail, MailFolder, MailRule } from '../types/mail';
import {
	ImapConnectionOptions,
	SmtpConnectionOptions,
} from '../core/mail/types';

const channels = Object.values(ipcChannels);

// Mail-specific channels
const mailChannels = [
	'mail:add-account',
	'mail:remove-account',
	'mail:update-account',
	'mail:connect-account',
	'mail:disconnect-account',
	'mail:get-folders',
	'mail:fetch-mails',
	'mail:mark-as-read',
	'mail:mark-as-starred',
	'mail:move-mail',
	'mail:delete-mail',
	'mail:send-mail',
	'mail:sync-account',
	'mail:sync-folder',
	'mail:search',
	'mail:add-rule',
	'mail:update-rule',
	'mail:remove-rule',
	'mail:get-rules',
	'mail:apply-rules',
	'mail:export-rules',
	'mail:import-rules',
	'mail:get-all-accounts',
	'mail:verify-imap-connection',
	'mail:verify-smtp-connection',
	// Window management
	'window:open-mail',
	'set-mail-id',
	// Events
	'mail:account-added',
	'mail:account-removed',
	'mail:sync-started',
	'mail:sync-progress',
	'mail:sync-completed',
	'mail:mails-added',
	'mail:mails-updated',
	'mail:error',
];

const authChannels = [
	'auth:register',
	'auth:login',
	'auth:get-user',
	'auth:update-profile',
	'auth:change-password',
	'auth:delete-account',
];

const googleAuthChannels = [
	'google:authenticate',
	'google:link-account',
	'google:get-linked-accounts',
	'google:refresh-token',
];

// Erweitere die Kanalliste um alle Mail-Kanäle
const allChannels = [...channels, ...mailChannels, ...authChannels, ...googleAuthChannels];

const electronHandler = {
	os: getOS(),
	setSettings: (settings: Partial<SettingsType>) =>
		ipcRenderer.send(ipcChannels.SET_SETTINGS, settings),
	setKeybind: (keybind: string, accelerator: string) =>
		ipcRenderer.send(ipcChannels.SET_KEYBIND, keybind, accelerator),
	triggerAppMenuItemById: (id: string) =>
		ipcRenderer.send(ipcChannels.TRIGGER_APP_MENU_ITEM_BY_ID, id),
	notify: (options: NotificationOptions) =>
		ipcRenderer.send(ipcChannels.APP_NOTIFICATION, options),
	playSound: (sound: string) => ipcRenderer.send(ipcChannels.PLAY_SOUND, sound),
	openUrl: (url: string) => ipcRenderer.send(ipcChannels.OPEN_URL, url),

	// Mail API
	mail: {
		// Account Operations
		addAccount: (account: MailAccount) =>
			ipcRenderer.invoke('mail:add-account', account),
		removeAccount: (accountId: number) =>
			ipcRenderer.invoke('mail:remove-account', accountId),
		updateAccount: (accountId: number, account: MailAccount) =>
			ipcRenderer.invoke('mail:update-account', accountId, account),
		connectAccount: (accountId: string) =>
			ipcRenderer.invoke('mail:connect-account', accountId),
		disconnectAccount: (accountId: string) =>
			ipcRenderer.invoke('mail:disconnect-account', accountId),
		getAllAccounts: () => ipcRenderer.invoke('mail:get-all-accounts'),
		verifyImapConnection: (options: ImapConnectionOptions) =>
			ipcRenderer.invoke('mail:verify-imap-connection', options),
		verifySmtpConnection: (options: SmtpConnectionOptions) =>
			ipcRenderer.invoke('mail:verify-smtp-connection', options),

		// Folder Operations
		getFolders: (accountId: string) =>
			ipcRenderer.invoke('mail:get-folders', accountId),

		// Mail Operations
		fetchMails: (accountId: string, folderId: string, limit?: number) =>
			ipcRenderer.invoke('mail:fetch-mails', accountId, folderId, limit),
		markAsRead: (mailId: string) =>
			ipcRenderer.invoke('mail:mark-as-read', mailId),
		markAsStarred: (mailId: string) =>
			ipcRenderer.invoke('mail:mark-as-starred', mailId),
		moveMail: (mailId: string, folderId: string) =>
			ipcRenderer.invoke('mail:move-mail', mailId, folderId),
		deleteMail: (mailId: string) =>
			ipcRenderer.invoke('mail:delete-mail', mailId),
		sendMail: (mail: any) => ipcRenderer.invoke('mail:send-mail', mail),

		// Sync Operations
		syncAccount: (accountId: string) =>
			ipcRenderer.invoke('mail:sync-account', accountId),
		syncFolder: (accountId: string, folderId: string) =>
			ipcRenderer.invoke('mail:sync-folder', accountId, folderId),

		// Search Operations
		search: (accountId: string, query: string) =>
			ipcRenderer.invoke('mail:search', accountId, query),

		// Rule Operations
		addRule: (rule: MailRule) => ipcRenderer.invoke('mail:add-rule', rule),
		updateRule: (ruleId: string, rule: MailRule) =>
			ipcRenderer.invoke('mail:update-rule', ruleId, rule),
		removeRule: (ruleId: string) =>
			ipcRenderer.invoke('mail:remove-rule', ruleId),
		getRules: (accountId: string) =>
			ipcRenderer.invoke('mail:get-rules', accountId),
		applyRules: (accountId: string, mailIds: string[]) =>
			ipcRenderer.invoke('mail:apply-rules', accountId, mailIds),
		exportRules: (accountId: string) =>
			ipcRenderer.invoke('mail:export-rules', accountId),
		importRules: (accountId: string, rules: MailRule[]) =>
			ipcRenderer.invoke('mail:import-rules', accountId, rules),

		// Event Listeners
		onAccountAdded: (callback: (account: MailAccount) => void) =>
			ipcRenderer.on('mail:account-added', (_event, account) =>
				callback(account),
			),
		onAccountUpdated: (callback: (account: MailAccount) => void) =>
			ipcRenderer.on('mail:account-updated', (_event, account) =>
				callback(account),
			),
		onAccountRemoved: (callback: (accountId: string) => void) =>
			ipcRenderer.on('mail:account-removed', (_event, accountId) =>
				callback(accountId),
			),
		onSyncStarted: (callback: (accountId: string) => void) =>
			ipcRenderer.on('mail:sync-started', (_event, accountId) =>
				callback(accountId),
			),
		onSyncCompleted: (callback: (accountId: string) => void) =>
			ipcRenderer.on('mail:sync-completed', (_event, accountId) =>
				callback(accountId),
			),
		onSyncError: (callback: (accountId: string, error: string) => void) =>
			ipcRenderer.on('mail:sync-error', (_event, accountId, error) =>
				callback(accountId, error),
			),
		onMailsReceived: (callback: (accountId: string, mails: Mail[]) => void) =>
			ipcRenderer.on('mail:mails-received', (_event, accountId, mails) =>
				callback(accountId, mails),
			),
		onMailUpdated: (callback: (mail: Mail) => void) =>
			ipcRenderer.on('mail:mail-updated', (_event, mail) => callback(mail)),
		onMailDeleted: (callback: (mailId: string) => void) =>
			ipcRenderer.on('mail:mail-deleted', (_event, mailId) => callback(mailId)),
		onFoldersReceived: (
			callback: (accountId: string, folders: MailFolder[]) => void,
		) =>
			ipcRenderer.on('mail:folders-received', (_event, accountId, folders) =>
				callback(accountId, folders),
			),
	},

	// Google Auth
	google: {
		authenticate: () => ipcRenderer.invoke('google:authenticate'),
		linkAccount: (data: { userId: string; tokens: any; userInfo: any }) =>
			ipcRenderer.invoke('google:link-account', data),
		getLinkedAccounts: (userId: string) =>
			ipcRenderer.invoke('google:get-linked-accounts', userId),
		refreshToken: (accountId: number) =>
			ipcRenderer.invoke('google:refresh-token', accountId),
	},

	// Window Management
	window: {
		openMail: () => ipcRenderer.invoke('window:open-mail'),
		onMailIdSet: (callback: (mailId: string) => void) =>
			ipcRenderer.on('set-mail-id', (_event, mailId) => callback(mailId)),
	},

	ipcRenderer: {
		invoke(channel: string, ...args: unknown[]) {
			if (!allChannels.includes(channel)) {
				throw new Error(`${$errors.invalidChannel}: ${channel}`);
			}
			return ipcRenderer.invoke(channel, ...args);
		},
		send(channel: string, ...args: unknown[]) {
			if (!allChannels.includes(channel)) {
				return;
			}
			return ipcRenderer.send(channel, ...args);
		},
		on(channel: string, func: (...args: unknown[]) => void) {
			if (!allChannels.includes(channel)) {
				return;
			}
			const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
				func(...args);
			ipcRenderer.on(channel, subscription);

			return () => {
				ipcRenderer.removeListener(channel, subscription);
			};
		},
		once(channel: string, func: (...args: unknown[]) => void) {
			if (!allChannels.includes(channel)) {
				return;
			}
			ipcRenderer.once(channel, (_event, ...args) => func(...args));
		},
		removeAllListeners(channel: string) {
			ipcRenderer.removeAllListeners(channel);
		},
	},
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
