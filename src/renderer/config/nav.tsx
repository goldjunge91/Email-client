import { SettingsJson } from '@/renderer/components/views/settings/SettingsJson';
import { SettingsAbout } from '@/renderer/components/views/settings/about/SettingsAbout';
import { SettingsAppearance } from '@/renderer/components/views/settings/appearance/SettingsAppearance';
import {
	BellIcon,
	BlendingModeIcon,
	GearIcon,
	IdCardIcon,
	ImageIcon,
	KeyboardIcon,
	EnvelopeClosedIcon,
} from '@radix-ui/react-icons';

import { SettingsApplication } from '@/renderer/components/views/settings/general/SettingsApplication';
import { SettingsKeyboard } from '@/renderer/components/views/settings/keyboard/SettingsKeyboard';
import { SettingsNotifications } from '@/renderer/components/views/settings/notifications/SettingsNotifications';
import { SettingsAccounts } from '../components/views/settings/accounts/SettingsAccounts';

export const nav = {
	home: {
		title: 'Home',
		href: '/',
	},
	settings: {
		title: 'Settings',
		href: '/settings',
	},
};

export const settingsNavItems = [
	{
		title: 'General',
		href: 'general',
		element: <SettingsApplication />,
		icon: GearIcon,
		index: true,
	},
	{
		title: 'Appearance',
		href: 'appearance',
		element: <SettingsAppearance />,
		icon: BlendingModeIcon,
	},

	{
		title: 'Accounts',
		href: '/settings/accounts',
		icon: EnvelopeClosedIcon,
		element: <SettingsAccounts />, // Das ist die entscheidende Zeile
		// label: 'accounts',
	},

	{
		title: 'Notifications',
		href: 'notifications',
		element: <SettingsNotifications />,
		icon: BellIcon,
	},
	{
		title: 'Display',
		href: 'display',
		element: <SettingsJson />,
		icon: ImageIcon,
	},
	{
		title: 'Keyboard',
		href: 'keyboard',
		element: <SettingsKeyboard />,
		icon: KeyboardIcon,
	},
	{
		title: 'About',
		href: 'about',
		element: <SettingsAbout />,
		icon: IdCardIcon,
	},
];
