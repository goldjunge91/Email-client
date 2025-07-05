import { LucideIcon } from 'lucide-react';

// Mail Types from Phase 1 Implementation

export interface MailAddress {
	name?: string;
	address: string;
}

export interface MailAttachment {
	id: string;
	filename: string;
	contentType: string;
	size: number;
	contentId?: string;
	url?: string;
}

export interface Mail {
	id: string;
	messageId: string;
	threadId?: string;
	accountId: string;
	folderId: string;
	subject: string;
	from: MailAddress[];
	to: MailAddress[];
	cc: MailAddress[];
	bcc: MailAddress[];
	replyTo: MailAddress[];
	date: Date;
	isRead: boolean;
	isStarred: boolean;
	isImportant: boolean;
	hasAttachments: boolean;
	attachments: MailAttachment[];
	textContent?: string;
	htmlContent?: string;
	snippet?: string;
	labels: string[];
	category: 'primary' | 'social' | 'promotions' | 'updates' | 'forums';
	priority: 'high' | 'normal' | 'low';
	size: number;
	flags: string[];
	headers: Record<string, string>;
	rawMessage?: string;
	isDraft: boolean;
	isSent: boolean;
	isDeleted: boolean;
	isSpam: boolean;
	isArchived: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface MailFolder {
	id: string;
	name: string;
	path: string;
	accountId: string;
	type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom';
	unreadCount: number;
	totalCount: number;
	icon: LucideIcon;
	parent?: string;
	children: string[];
	attributes: string[];
	delimiter: string;
	subscribed: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface MailAccount {
	id: string;
	email: string;
	name: string;
	displayName?: string;
	avatar?: string;
	isDefault: boolean;
	isActive: boolean;
	settings: {
		incomingServer: {
			type: 'imap' | 'pop3';
			host: string;
			port: number;
			secure: boolean;
			auth: {
				user: string;
				pass: string;
			};
			tls?: {
				rejectUnauthorized: boolean;
			};
		};
		outgoingServer: {
			type: 'smtp';
			host: string;
			port: number;
			secure: boolean;
			auth: {
				user: string;
				pass: string;
			};
			tls?: {
				rejectUnauthorized: boolean;
			};
		};
		autoSync: boolean;
		syncInterval: number;
		maxSyncItems: number;
		syncOnStartup: boolean;
	};
	folders: MailFolder[];
	stats: {
		totalMails: number;
		unreadMails: number;
		lastSync: Date;
		storageUsed: number;
	};
	createdAt: Date;
	updatedAt: Date;
}

export interface RuleCondition {
	type: 'simple' | 'group' | 'javascript';
	field?: string;
	operator?:
		| 'contains'
		| 'equals'
		| 'startsWith'
		| 'endsWith'
		| 'regex'
		| 'exists'
		| 'not_exists'
		| 'greater'
		| 'less'
		| 'between';
	value?: string;
	caseSensitive?: boolean;
	group?: {
		operator: 'AND' | 'OR' | 'NOT';
		conditions: RuleCondition[];
	};
	javascript?: {
		code: string;
		timeout: number;
	};
}

export interface RuleAction {
	type:
		| 'move'
		| 'label'
		| 'markRead'
		| 'markImportant'
		| 'delete'
		| 'forward'
		| 'notify'
		| 'script';
	value: string;
	options?: Record<string, any>;
}

export interface MailRule {
	id: string;
	accountId: string;
	name: string;
	description?: string;
	isEnabled: boolean;
	priority: number;
	conditions: RuleCondition[];
	actions: RuleAction[];
	stopProcessing: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface MailFilter {
	id: string;
	accountId: string;
	name: string;
	isEnabled: boolean;
	conditions: {
		field: 'from' | 'to' | 'subject' | 'body' | 'header';
		operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex';
		value: string;
	}[];
	actions: {
		type:
			| 'move'
			| 'label'
			| 'markRead'
			| 'markImportant'
			| 'delete'
			| 'forward';
		value: string;
	}[];
	createdAt: Date;
	updatedAt: Date;
}

export interface SmartInbox {
	id: string;
	accountId: string;
	name: string;
	description?: string;
	query: string;
	color: string;
	icon: string;
	isEnabled: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface NotificationSettings {
	enabled: boolean;
	sound: boolean;
	desktop: boolean;
	badge: boolean;
	filters: {
		importantOnly: boolean;
		fromContacts: boolean;
		keywords: string[];
	};
}
