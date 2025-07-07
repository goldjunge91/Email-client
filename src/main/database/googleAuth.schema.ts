import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './schema';

// Google OAuth providers table
export const googleAuthProviders = pgTable('google_auth_providers', {
	userId: varchar('user_id', { length: 36 })
		.notNull()
		.references(() => users.uuid, { onDelete: 'cascade' })
		.primaryKey(),
	googleId: varchar('google_id', { length: 255 }).notNull().unique(),
	email: varchar('email', { length: 255 }).notNull(),
	name: varchar('name', { length: 255 }),
	picture: text('picture'),
	accessToken: text('access_token').notNull(),
	refreshToken: text('refresh_token').notNull(),
	tokenExpiry: timestamp('token_expiry').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type GoogleAuthProvider = typeof googleAuthProviders.$inferSelect;
export type NewGoogleAuthProvider = typeof googleAuthProviders.$inferInsert;
