import React, { useState, useEffect, useCallback } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/renderer/components/ui/dialog';
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
	Trash2,
	Edit,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/renderer/context/AuthContextNew';
import { mailService } from '@/renderer/services/mailService';
import type { MailAccount } from '@/renderer/services/mailService';
import { AddAccountModal } from './AddAccountModal';
import { ProfileEditModal } from './ProfileEditModal';

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
	const [loadingAccounts, setLoadingAccounts] = useState(false);
	const { user, logout } = useAuth();

	const loadAccounts = useCallback(async () => {
		if (!user) return;
		setLoadingAccounts(true);
		try {
			const userAccounts = await mailService.getAccountsByUserId(user.id);
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
						{user?.name || 'Unbekannter Benutzer'}
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
					<Button variant="ghost" size="sm">
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
			<div>
				<h3 className="text-lg font-semibold mb-4">E-Mail-Konten</h3>
				{loadingAccounts ? (
					<div className="flex items-center justify-center p-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
					</div>
				) : (
					<div className="space-y-3">
						{accounts.map((account) => (
							<div
								key={account.id}
								className="flex items-center justify-between p-4 border rounded-lg"
							>
								<div className="flex items-center space-x-3">
									<Avatar className="h-10 w-10">
										<AvatarFallback>
											{account.email.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="font-medium">{account.display_name}</p>
										<p className="text-sm text-muted-foreground">
											{account.email}
										</p>
									</div>
								</div>
								<div className="flex space-x-2">
									<Button variant="outline" size="sm">
										<Edit className="h-4 w-4 mr-2" />
										Bearbeiten
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleDeleteAccount(account.id)}
									>
										<Trash2 className="h-4 w-4 mr-2" />
										Löschen
									</Button>
								</div>
							</div>
						))}
						<Button
							variant="outline"
							className="w-full"
							onClick={() => setShowAddAccount(true)}
						>
							+ Neues Konto hinzufügen
						</Button>
					</div>
				)}
			</div>
		</div>
	);

	const renderContent = () => {
		switch (activeSection) {
			case 'account':
				return renderAccountSection();
			case 'general':
				return renderGeneralSection();
			case 'accounts':
				return renderAccountsSection();
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
				return null;
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-4xl h-[600px] p-0">
					<DialogHeader className="p-6 pb-0">
						<DialogTitle>Einstellungen</DialogTitle>
					</DialogHeader>
					<div className="flex h-full">
						{/* Sidebar Navigation */}
						<div className="w-64 border-r bg-muted/30 p-4">
							<nav className="space-y-2">
								{settingsNavigation.map((item) => {
									const Icon = item.icon;
									return (
										<button
											key={item.id}
											type="button"
											onClick={() => setActiveSection(item.id)}
											className={cn(
												'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
												activeSection === item.id
													? 'bg-primary text-primary-foreground'
													: 'hover:bg-muted',
											)}
										>
											<Icon className="h-5 w-5" />
											<span className="text-sm font-medium">{item.label}</span>
										</button>
									);
								})}
							</nav>
						</div>

						{/* Main Content */}
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
				</>
			)}
		</>
	);
}
