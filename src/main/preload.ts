import { $errors } from '@/config/strings';
import { NotificationOptions } from '@/types/notification';
import { getOS } from '@/utils/getOS';
// eslint-disable-next-line import/no-extraneous-dependencies
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { ipcChannels } from '../config/ipc-channels';
import { SettingsType } from '../config/settings';
import { Account } from '../core/mail/imapClient';

const channels = Object.values(ipcChannels);

// Erweitere die Kanalliste um unseren neuen Kanal
const allChannels = [...channels, 'verify-account'];

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
