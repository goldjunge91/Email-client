import React, { useState } from 'react';
import {
	Inbox,
	FileText,
	Send,
	Trash2,
	AlertOctagon,
	Archive,
	Settings,
} from 'lucide-react';
import { MailAccount } from '@/types/mail';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/renderer/components/ui/button';
import { Separator } from '@/renderer/components/ui/separator';
import { useSidebar } from '@/renderer/context/SidebarContext';
import { SettingsModal } from '@/renderer/components/settings/SettingsModal';

// --- Mock Data ---
// This data serves as a placeholder until we integrate with a real email backend.

const accounts: MailAccount[] = [
	{
		id: 'account-1',
		email: 'goldjunge@gmail.com',
		name: 'Gmail',
		folders: [
			{ id: 'inbox-1', name: 'Inbox', icon: Inbox },
			{ id: 'sent-1', name: 'Sent', icon: Send },
		],
	},
	{
		id: 'account-2',
		email: 'work.user@company.com',
		name: 'Work',
		folders: [
			{ id: 'inbox-2', name: 'Inbox', icon: Inbox },
			{ id: 'sent-2', name: 'Sent', icon: Send },
		],
	},
];

const pinnedFolders = [
	{ id: 'drafts', name: 'Drafts', icon: FileText },
	{ id: 'archive', name: 'Archive', icon: Archive },
	{ id: 'spam', name: 'Spam', icon: AlertOctagon },
	{ id: 'trash', name: 'Trash', icon: Trash2 },
];

// --- Component ---

export function EmailSidebar() {
	const { isOpen } = useSidebar();
	const [settingsOpen, setSettingsOpen] = useState(false);

	return (
		<div className="flex flex-col h-full bg-card text-card-foreground">
			{/* Smart Inbox Section */}
			<div className="p-3">
				{!isOpen ? (
					<div className="flex justify-center">
						<Inbox className="h-6 w-6 text-muted-foreground" />
					</div>
				) : (
					<>
						<h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
							Smart Inbox
						</h2>
						<div className="space-y-1">
							<button
								type="button"
								className={cn(
									buttonVariants({ variant: 'secondary' }),
									'w-full justify-start font-bold',
								)}
							>
								<Inbox className="mr-2 h-4 w-4" />
								All Inboxes
							</button>
						</div>
					</>
				)}
			</div>

			{isOpen && <Separator className="my-2" />}

			{/* Individual Accounts Section */}
			<div className="p-3">
				{!isOpen ? (
					<div className="space-y-2">
						{accounts.map((account) => (
							<div key={account.id} className="flex justify-center">
								<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
									<span className="text-xs font-semibold text-primary">
										{account.name.charAt(0)}
									</span>
								</div>
							</div>
						))}
					</div>
				) : (
					<>
						<h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
							Accounts
						</h2>
						<div className="space-y-2">
							{accounts.map((account) => (
								<div key={account.id}>
									<h3 className="mb-1 px-2 text-sm font-semibold text-muted-foreground">
										{account.name}
									</h3>
									{account.folders.map((folder) => {
										const Icon = folder.icon;
										return (
											<button
												key={folder.id}
												type="button"
												className={cn(
													buttonVariants({ variant: 'ghost' }),
													'w-full justify-start',
												)}
											>
												<Icon className="mr-2 h-4 w-4" />
												{folder.name}
											</button>
										);
									})}
								</div>
							))}
						</div>
					</>
				)}
			</div>

			{isOpen && <Separator className="my-2" />}

			{/* Pinned Folders Section */}
			<div className="p-3">
				{!isOpen ? (
					<div className="space-y-2">
						{pinnedFolders.map((folder) => {
							const Icon = folder.icon;
							return (
								<div key={folder.id} className="flex justify-center">
									<Icon className="h-5 w-5 text-muted-foreground" />
								</div>
							);
						})}
					</div>
				) : (
					<>
						<h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
							Pinned
						</h2>
						<div className="space-y-1">
							{pinnedFolders.map((folder) => {
								const Icon = folder.icon;
								return (
									<button
										key={folder.id}
										type="button"
										className={cn(
											buttonVariants({ variant: 'ghost' }),
											'w-full justify-start',
										)}
									>
										<Icon className="mr-2 h-4 w-4" />
										{folder.name}
									</button>
								);
							})}
						</div>
					</>
				)}
			</div>

			{/* Settings Button */}
			<div className="mt-auto p-3">
				{isOpen && <Separator className="mb-3" />}
				{!isOpen ? (
					<div className="flex justify-center">
						<button
							type="button"
							onClick={() => setSettingsOpen(true)}
							className={cn(
								buttonVariants({ variant: 'ghost', size: 'sm' }),
								'h-8 w-8 p-0',
							)}
						>
							<Settings className="h-5 w-5 text-muted-foreground" />
						</button>
					</div>
				) : (
					<button
						type="button"
						onClick={() => setSettingsOpen(true)}
						className={cn(
							buttonVariants({ variant: 'ghost' }),
							'w-full justify-start',
						)}
					>
						<Settings className="mr-2 h-4 w-4" />
						Settings
					</button>
				)}
			</div>

			{/* Settings Modal */}
			<SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
		</div>
	);
}
