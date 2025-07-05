import { $errors } from '@/config/strings';
import { NotificationOptions } from '@/types/notification';
import { getOS } from '@/utils/getOS';
// eslint-disable-next-line import/no-extraneous-dependencies
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { ipcChannels } from '../config/ipc-channels';
import { SettingsType } from '../config/settings';
import { Account } from '../core/mail/imapClient';
import { 
  MailAccount, 
  Mail, 
  MailFolder,
  MailRule,
  MailFilter 
} from '../types/mail';

const channels = Object.values(ipcChannels);

// Mail-specific channels
const mailChannels = [
  'verify-account',
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
  // Events
  'mail:account-added',
  'mail:account-removed',
  'mail:sync-started',
  'mail:sync-progress',
  'mail:sync-completed',
  'mail:mails-added',
  'mail:mails-updated',
  'mail:error'
];

// Erweitere die Kanalliste um alle Mail-Kanäle
const allChannels = [...channels, ...mailChannels];

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

	// TODO new function added to verify account
	verifyAccount: (account: Account) =>
		ipcRenderer.invoke('verify-account', account),

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
