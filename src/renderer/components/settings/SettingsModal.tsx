/* eslint-disable no-nested-ternary */
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/renderer/components/ui/dialog';
import { Button } from '@/renderer/components/ui/button';
import { Separator } from '@/renderer/components/ui/separator';
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '@/renderer/components/ui/avatar';
import { Badge } from '@/renderer/components/ui/badge';
import {
	Settings,
	User,
	Users,
	Mail,
	Palette,
	Bell,
	Shield,
	HelpCircle,
	CreditCard,
	LogOut,
	ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/renderer/context/AuthContextNew';

import { MailService, mailService } from '@/renderer/utils/mailService';
import { AddAccountModal } from './AddAccountModal';
import { ProfileEditModal } from './ProfileEditModal';
import { DeviceListModal } from './DeviceListModal';
import type { MailAccount } from '../../../types/mail';

interface SettingsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type SettingsSection =
	| 'account'
	| 'general'
	| 'accounts'
	| 'teams'
	| 'appearance'
	| 'notifications'
	| 'privacy'
	| 'help';

const settingsNavigation = [
	{ id: 'account', label: 'Account', icon: User },
	{ id: 'general', label: 'Allgemein', icon: Settings },
	{ id: 'accounts', label: 'Konten', icon: Mail },
	{ id: 'teams', label: 'Teams', icon: Users },
	{ id: 'appearance', label: 'Erscheinungsbild', icon: Palette },
	{ id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
	{ id: 'privacy', label: 'Datenschutz', icon: Shield },
	{ id: 'help', label: 'Hilfe', icon: HelpCircle },
] as const;

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
	const [activeSection, setActiveSection] =
		useState<SettingsSection>('account');
	const [accounts, setAccounts] = useState<MailAccount[]>([]);
	const [showAddAccount, setShowAddAccount] = useState(false);
	const [showProfileEdit, setShowProfileEdit] = useState(false);
	const [showDeviceList, setShowDeviceList] = useState(false);
	const [loadingAccounts, setLoadingAccounts] = useState(false);
	const { user, logout } = useAuth();

	const loadAccounts = useCallback(async () => {
		if (!user) return;
		setLoadingAccounts(true);
		try {
			const userAccounts = await MailService.getAccountsByUserId(user.id);
			setAccounts(userAccounts);
		} catch {
			// Handle error silently or show user feedback
		} finally {
			setLoadingAccounts(false);
		}
	}, [user]);

	useEffect(() => {
		if (open && user) {
			loadAccounts();
		}
	}, [open, user, loadAccounts]);

	const handleAccountAdded = (account: MailAccount) => {
		setAccounts((prev) => [...prev, account]);
	};

	const handleDeleteAccount = async (accountId: number) => {
		try {
			await mailService.deleteAccount(accountId);
			setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
		} catch {
			// Handle error silently or show user feedback
		}
	};

	const handleLogout = async () => {
		await logout();
		onOpenChange(false);
	};

	const getUserInitials = (name: string, email: string) => {
		if (name && name.trim()) {
			return name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2);
		}
		return email.charAt(0).toUpperCase();
	};

	const renderAccountSection = () => (
		<div className="space-y-6">
			<div className="flex items-center space-x-4">
				<Avatar className="h-16 w-16">
					<AvatarImage src="" alt="User Avatar" />
					<AvatarFallback className="text-lg">
						{user ? getUserInitials(user.name || '', user.email) : 'U'}
					</AvatarFallback>
				</Avatar>
				<div>
					<h3 className="text-lg font-semibold">
						{user?.name || user?.email || 'Unbekannter Benutzer'}
					</h3>
					<p className="text-sm text-muted-foreground">
						{user?.email || 'Keine E-Mail'}
					</p>
				</div>
			</div>

			<div className="space-y-4">
				<div className="flex items-center justify-between p-4 border rounded-lg">
					<div className="flex items-center space-x-3">
						<CreditCard className="h-5 w-5 text-muted-foreground" />
						<div>
							<p className="font-medium">Kostenlose Premium-Testversion</p>
							<p className="text-sm text-muted-foreground">
								Läuft ab am 12.10.2025
							</p>
						</div>
					</div>
					<Button variant="outline" size="sm">
						Upgrade
						<Badge variant="secondary" className="ml-2">
							Premium
						</Badge>
					</Button>
				</div>

				<div className="flex items-center justify-between p-4 border rounded-lg">
					<div className="flex items-center space-x-3">
						<Settings className="h-5 w-5 text-muted-foreground" />
						<div>
							<p className="font-medium">Synchronisierte Geräte</p>
							<p className="text-sm text-muted-foreground">
								2 Geräte verbunden
							</p>
						</div>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowDeviceList(true)}
					>
						Geräte anzeigen
						<ChevronRight className="ml-2 h-4 w-4" />
					</Button>
				</div>

				<div className="flex items-center justify-between p-4 border rounded-lg">
					<div className="flex items-center space-x-3">
						<User className="h-5 w-5 text-muted-foreground" />
						<div>
							<p className="font-medium">Profil bearbeiten</p>
							<p className="text-sm text-muted-foreground">
								Name, Foto und weitere Einstellungen
							</p>
						</div>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowProfileEdit(true)}
					>
						Bearbeiten
						<ChevronRight className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</div>

			<Separator />

			<div className="space-y-2">
				<Button
					variant="ghost"
					size="sm"
					className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
					onClick={handleLogout}
				>
					<LogOut className="mr-2 h-4 w-4" />
					Abmelden
				</Button>
			</div>
		</div>
	);

	const renderGeneralSection = () => (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold mb-4">Allgemeine Einstellungen</h3>
				<div className="space-y-4">
					<div className="flex items-center justify-between p-4 border rounded-lg">
						<div>
							<p className="font-medium">Sprache</p>
							<p className="text-sm text-muted-foreground">Deutsch</p>
						</div>
						<Button variant="outline" size="sm">
							Ändern
						</Button>
					</div>
					<div className="flex items-center justify-between p-4 border rounded-lg">
						<div>
							<p className="font-medium">Zeitzone</p>
							<p className="text-sm text-muted-foreground">Europa/Berlin</p>
						</div>
						<Button variant="outline" size="sm">
							Ändern
						</Button>
					</div>
				</div>
			</div>
		</div>
	);

	const renderAccountsSection = () => (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Verknüpfte Mail-Konten</h2>
				<Button
					onClick={() => setShowAddAccount(true)}
					variant="default"
					size="sm"
				>
					Konto hinzufügen
				</Button>
			</div>
			{loadingAccounts ? (
				<div>Lade Konten...</div>
			) : accounts.length === 0 ? (
				<div className="text-muted-foreground">
					Noch keine Mail-Konten verknüpft.
				</div>
			) : (
				<ul className="divide-y divide-border">
					{accounts.map((account) => (
						<li
							key={account.id}
							className="flex items-center justify-between py-3"
						>
							<div>
								<div className="font-medium">
									{account.name || account.email}
								</div>
								<div className="text-xs text-muted-foreground">
									{account.email}
								</div>
							</div>
							<Button
								variant="destructive"
								size="sm"
								onClick={() => handleDeleteAccount(account.id)}
								disabled={loadingAccounts}
							>
								Entfernen
							</Button>
						</li>
					))}
				</ul>
			)}
			{/* Modal zum Hinzufügen eines Accounts */}
			{showAddAccount && (
				<AddAccountModal
					open={showAddAccount}
					onOpenChange={setShowAddAccount}
					onAccountAdded={handleAccountAdded}
					userId={user?.id}
				/>
			)}
		</div>
	);

	const renderContent = () => {
		switch (activeSection) {
			case 'accounts':
				return renderAccountsSection();
			case 'general':
				return renderGeneralSection();
			case 'teams':
				return (
					<div className="space-y-6">
						<h3 className="text-lg font-semibold">Teams</h3>
						<p className="text-muted-foreground">Keine Teams verfügbar</p>
					</div>
				);
			case 'appearance':
				return (
					<div className="space-y-6">
						<h3 className="text-lg font-semibold">Erscheinungsbild</h3>
						<p className="text-muted-foreground">
							Design und Theme-Einstellungen
						</p>
					</div>
				);
			case 'notifications':
				return (
					<div className="space-y-6">
						<h3 className="text-lg font-semibold">Benachrichtigungen</h3>
						<p className="text-muted-foreground">
							Benachrichtigungseinstellungen
						</p>
					</div>
				);
			case 'privacy':
				return (
					<div className="space-y-6">
						<h3 className="text-lg font-semibold">Datenschutz</h3>
						<p className="text-muted-foreground">Datenschutz und Sicherheit</p>
					</div>
				);
			case 'help':
				return (
					<div className="space-y-6">
						<h3 className="text-lg font-semibold">Hilfe</h3>
						<p className="text-muted-foreground">Support und Dokumentation</p>
					</div>
				);
			default:
				return renderAccountSection();
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-2xl w-full">
					<div className="flex h-full">
						{/* Navigation */}
						<nav className="w-56 border-r border-border py-6 pr-4 flex flex-col gap-2">
							{settingsNavigation.map((item) => (
								<Button
									key={item.id}
									variant={activeSection === item.id ? 'secondary' : 'ghost'}
									className="justify-start w-full"
									onClick={() => setActiveSection(item.id)}
								>
									<item.icon className="w-4 h-4 mr-2" />
									{item.label}
								</Button>
							))}
						</nav>
						{/* Content */}
						<div className="flex-1 p-6 overflow-y-auto">{renderContent()}</div>
					</div>
				</DialogContent>
			</Dialog>

			{user && (
				<>
					<AddAccountModal
						open={showAddAccount}
						onOpenChange={setShowAddAccount}
						onAccountAdded={handleAccountAdded}
						userId={user.id}
					/>
					<ProfileEditModal
						open={showProfileEdit}
						onOpenChange={setShowProfileEdit}
					/>
					<DeviceListModal
						open={showDeviceList}
						onOpenChange={setShowDeviceList}
					/>
				</>
			)}
		</>
	);
}
