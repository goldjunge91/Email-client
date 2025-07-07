import {
	pgTable,
	serial,
	varchar,
	text,
	timestamp,
	boolean,
	integer,
	jsonb,
	uniqueIndex,
} from 'drizzle-orm/pg-core';
import { randomUUID } from 'crypto';

// Users Table
export const users = pgTable(
	'users',
	{
		id: serial('id').primaryKey(),
		uuid: varchar('uuid', { length: 36 })
			.notNull()
			.unique()
			.$defaultFn(() => randomUUID()),
		email: varchar('email', { length: 255 }).notNull().unique(),
		username: varchar('username', { length: 100 }).notNull().unique(),
		firstName: varchar('first_name', { length: 100 }),
		lastName: varchar('last_name', { length: 100 }),

		// Authentication
		passwordHash: text('password_hash').notNull(),
		salt: varchar('salt', { length: 32 }).notNull(),

		// Account Status
		isActive: boolean('is_active').notNull().default(true),
		isEmailVerified: boolean('is_email_verified').notNull().default(false),
		emailVerificationToken: varchar('email_verification_token', {
			length: 255,
		}),
		emailVerificationExpiry: timestamp('email_verification_expiry'),

		// Password Reset
		passwordResetToken: varchar('password_reset_token', { length: 255 }),
		passwordResetExpiry: timestamp('password_reset_expiry'),

		// Session Management
		lastLoginAt: timestamp('last_login_at'),
		lastActiveAt: timestamp('last_active_at'),

		// Settings
		settings: jsonb('settings').$type<{
			theme?: 'light' | 'dark' | 'system';
			language?: string;
			timezone?: string;
			notifications?: boolean;
		}>(),

		// Metadata
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		emailIdx: uniqueIndex('users_email_idx').on(table.email),
		usernameIdx: uniqueIndex('users_username_idx').on(table.username),
	}),
);

// Mail Accounts Table
export const mailAccounts = pgTable(
	'mail_accounts',
	{
		id: serial('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 255 }).notNull(),
		email: varchar('email', { length: 255 }).notNull(),
		provider: varchar('provider', { length: 100 }).notNull(), // gmail, outlook, imap, etc.

		// IMAP Konfiguration
		imapHost: varchar('imap_host', { length: 255 }).notNull(),
		imapPort: integer('imap_port').notNull().default(993),
		imapSecure: boolean('imap_secure').notNull().default(true),

		// SMTP Konfiguration
		smtpHost: varchar('smtp_host', { length: 255 }).notNull(),
		smtpPort: integer('smtp_port').notNull().default(587),
		smtpSecure: boolean('smtp_secure').notNull().default(true),

		// Authentifizierung (verschlüsselt gespeichert)
		username: varchar('username', { length: 255 }).notNull(),
		password: text('password').notNull(), // Verschlüsselt

		// OAuth Token (für Gmail, Outlook etc.)
		oauthAccessToken: text('oauth_access_token'),
		oauthRefreshToken: text('oauth_refresh_token'),
		oauthTokenExpiry: timestamp('oauth_token_expiry'),

		// Account Status
		isActive: boolean('is_active').notNull().default(true),
		lastSyncDate: timestamp('last_sync_date'),
		syncStatus: varchar('sync_status', { length: 50 }).default('idle'), // idle, syncing, error
		syncError: text('sync_error'),

		// Metadaten
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => ({
		emailIdx: uniqueIndex('email_idx').on(table.email),
	}),
);

// Mail Folders Table
export const mailFolders = pgTable('mail_folders', {
	id: serial('id').primaryKey(),
	accountId: integer('account_id')
		.notNull()
		.references(() => mailAccounts.id, { onDelete: 'cascade' }),
	name: varchar('name', { length: 255 }).notNull(),
	displayName: varchar('display_name', { length: 255 }).notNull(),
	type: varchar('type', { length: 50 }).notNull(), // inbox, sent, drafts, trash, spam, custom
	path: varchar('path', { length: 500 }).notNull(), // IMAP folder path
	delimiter: varchar('delimiter', { length: 10 }).default('/'),

	// Folder Attributes
	isSelectable: boolean('is_selectable').notNull().default(true),
	hasChildren: boolean('has_children').notNull().default(false),
	unreadCount: integer('unread_count').notNull().default(0),
	totalCount: integer('total_count').notNull().default(0),

	// Metadaten
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Mails Table
export const mails = pgTable('mails', {
	id: serial('id').primaryKey(),
	accountId: integer('account_id')
		.notNull()
		.references(() => mailAccounts.id, { onDelete: 'cascade' }),
	folderId: integer('folder_id')
		.notNull()
		.references(() => mailFolders.id, { onDelete: 'cascade' }),

	// Mail Identifiers
	uid: integer('uid').notNull(), // IMAP UID
	messageId: varchar('message_id', { length: 500 }).notNull(),
	threadId: varchar('thread_id', { length: 255 }),

	// Mail Headers
	subject: text('subject').notNull(),
	from: jsonb('from').notNull(), // Array of {name: string, address: string}
	to: jsonb('to').notNull(), // Array of {name: string, address: string}
	cc: jsonb('cc'), // Array of {name: string, address: string}
	bcc: jsonb('bcc'), // Array of {name: string, address: string}
	replyTo: jsonb('reply_to'), // Array of {name: string, address: string}

	// Mail Content
	textContent: text('text_content'),
	htmlContent: text('html_content'),
	snippet: varchar('snippet', { length: 500 }),

	// Mail Metadata
	date: timestamp('date').notNull(),
	receivedDate: timestamp('received_date').notNull().defaultNow(),
	size: integer('size'), // Size in bytes

	// Mail Flags
	isRead: boolean('is_read').notNull().default(false),
	isStarred: boolean('is_starred').notNull().default(false),
	isFlagged: boolean('is_flagged').notNull().default(false),
	isAnswered: boolean('is_answered').notNull().default(false),
	isDraft: boolean('is_draft').notNull().default(false),
	isDeleted: boolean('is_deleted').notNull().default(false),

	// Attachments
	hasAttachments: boolean('has_attachments').notNull().default(false),
	attachmentCount: integer('attachment_count').notNull().default(0),

	// Metadaten
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Mail Attachments Table
export const mailAttachments = pgTable('mail_attachments', {
	id: serial('id').primaryKey(),
	mailId: integer('mail_id')
		.notNull()
		.references(() => mails.id, { onDelete: 'cascade' }),

	// Attachment Info
	filename: varchar('filename', { length: 255 }).notNull(),
	mimeType: varchar('mime_type', { length: 255 }).notNull(),
	size: integer('size').notNull(), // Size in bytes
	contentId: varchar('content_id', { length: 255 }), // For inline attachments

	// File Storage
	localPath: varchar('local_path', { length: 500 }), // Local file path
	isInline: boolean('is_inline').notNull().default(false),

	// Metadaten
	createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Mail Labels/Tags Table (für Gmail-style labels)
export const mailLabels = pgTable('mail_labels', {
	id: serial('id').primaryKey(),
	accountId: integer('account_id')
		.notNull()
		.references(() => mailAccounts.id, { onDelete: 'cascade' }),
	name: varchar('name', { length: 255 }).notNull(),
	color: varchar('color', { length: 7 }), // Hex color code

	createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Junction table for mail-label relationships
export const mailLabelRelations = pgTable('mail_label_relations', {
	id: serial('id').primaryKey(),
	mailId: integer('mail_id')
		.notNull()
		.references(() => mails.id, { onDelete: 'cascade' }),
	labelId: integer('label_id')
		.notNull()
		.references(() => mailLabels.id, { onDelete: 'cascade' }),
});

// Devices Table
export const devices = pgTable('devices', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: varchar('name', { length: 255 }).notNull(),
	type: varchar('type', { length: 50 }).notNull(), // e.g., 'desktop', 'mobile', 'web'
	deviceIdentifier: varchar('device_identifier', { length: 255 })
		.notNull()
		.unique(),
	lastUsedAt: timestamp('last_used_at').notNull().defaultNow(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Sessions Table
export const sessions = pgTable('sessions', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	deviceId: integer('device_id')
		.notNull()
		.references(() => devices.id, { onDelete: 'cascade' }),
	sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
});


// Sync Status Table für detailliertere Sync-Informationen
export const syncStatus = pgTable('sync_status', {
	id: serial('id').primaryKey(),
	accountId: integer('account_id')
		.notNull()
		.references(() => mailAccounts.id, { onDelete: 'cascade' }),
	folderId: integer('folder_id').references(() => mailFolders.id, {
		onDelete: 'cascade',
	}),

	// Sync Info
	lastSyncDate: timestamp('last_sync_date').notNull().defaultNow(),
	lastUid: integer('last_uid'), // Letzter synchronisierter UID
	syncType: varchar('sync_type', { length: 50 }).notNull(), // full, incremental
	status: varchar('status', { length: 50 }).notNull(), // success, error, in_progress
	errorMessage: text('error_message'),

	// Statistics
	emailsProcessed: integer('emails_processed').default(0),
	emailsAdded: integer('emails_added').default(0),
	emailsUpdated: integer('emails_updated').default(0),

	createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Export types für TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type MailAccount = typeof mailAccounts.$inferSelect;
export type NewMailAccount = typeof mailAccounts.$inferInsert;

export type MailFolder = typeof mailFolders.$inferSelect;
export type NewMailFolder = typeof mailFolders.$inferInsert;

export type Mail = typeof mails.$inferSelect;
export type NewMail = typeof mails.$inferInsert;

export type MailAttachment = typeof mailAttachments.$inferSelect;
export type NewMailAttachment = typeof mailAttachments.$inferInsert;

export type MailLabel = typeof mailLabels.$inferSelect;
export type NewMailLabel = typeof mailLabels.$inferInsert;

export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type SyncStatus = typeof syncStatus.$inferSelect;
export type NewSyncStatus = typeof syncStatus.$inferInsert;
