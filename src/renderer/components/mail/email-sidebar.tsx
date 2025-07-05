import React from 'react';
import {
	Inbox,
	FileText,
	Send,
	Trash2,
	AlertOctagon,
	Archive,
} from 'lucide-react';
import { MailAccount } from '@/types/mail';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/renderer/components/ui/button';
import { Separator } from '@/renderer/components/ui/separator';

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
	return (
		<div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-2">
			{/* Smart Inbox Section */}
			<div className="p-2">
				<h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
					Smart Inbox
				</h2>
				<div className="space-y-1">
					<a
						href="#"
						className={cn(
							buttonVariants({ variant: 'secondary' }),
							'w-full justify-start font-bold',
						)}
					>
						<Inbox className="mr-2 h-4 w-4" />
						All Inboxes
					</a>
				</div>
			</div>

			<Separator className="my-2" />

			{/* Individual Accounts Section */}
			<div className="p-2">
				<h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
					Accounts
				</h2>
				<div className="space-y-2">
					{accounts.map((account) => (
						<div key={account.id}>
							<h3 className="mb-1 px-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
								{account.name}
							</h3>
							{account.folders.map((folder) => {
								const Icon = folder.icon;
								return (
									<a
										key={folder.id}
										href="#"
										className={cn(
											buttonVariants({ variant: 'ghost' }),
											'w-full justify-start',
										)}
									>
										<Icon className="mr-2 h-4 w-4" />
										{folder.name}
									</a>
								);
							})}
						</div>
					))}
				</div>
			</div>

			<Separator className="my-2" />

			{/* Pinned Folders Section */}
			<div className="p-2">
				<h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
					Pinned
				</h2>
				<div className="space-y-1">
					{pinnedFolders.map((folder) => {
						const Icon = folder.icon;
						return (
							<a
								key={folder.id}
								href="#"
								className={cn(
									buttonVariants({ variant: 'ghost' }),
									'w-full justify-start',
								)}
							>
								<Icon className="mr-2 h-4 w-4" />
								{folder.name}
							</a>
						);
					})}
				</div>
			</div>
		</div>
	);
}
