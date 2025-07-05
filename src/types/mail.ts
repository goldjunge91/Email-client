import { LucideIcon } from 'lucide-react';

/**
 * Represents a folder within an email account.
 */
export interface MailFolder {
	id: string;
	name: string;
	icon: LucideIcon; // Using LucideIcon for type safety with icons
}

/**
 * Represents a single email account.
 */
export interface MailAccount {
	id: string;
	email: string;
	name: string;
	folders: MailFolder[];
}
