/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
import { eq, or } from 'drizzle-orm';
import { randomBytes, pbkdf2Sync } from 'crypto';
import { getDatabase } from '../connection';
import { users } from '../schema';
import type { User, NewUser } from '../schema';

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface RegisterData {
	email: string;
	username: string;
	password: string;
	firstName?: string;
	lastName?: string;
}

export interface AuthResult {
	success: boolean;
	user?: User;
	error?: string;
}

export class AuthService {
	private db = getDatabase();

	/**
	 * Passwort hashen mit Salt
	 */
	private static hashPassword(password: string, salt: string): string {
		return pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
	}

	/**
	 * Salt generieren
	 */
	private static generateSalt(): string {
		return randomBytes(16).toString('hex');
	}

	/**
	 * Benutzer registrieren
	 */
	async register(data: RegisterData): Promise<AuthResult> {
		try {
			// Prüfen ob E-Mail oder Username bereits existiert
			const existingUser = await this.db
				.select()
				.from(users)
				.where(
					or(eq(users.email, data.email), eq(users.username, data.username)),
				)
				.limit(1);

			if (existingUser.length > 0) {
				const existing = existingUser[0];
				if (existing.email === data.email) {
					return {
						success: false,
						error: 'E-Mail-Adresse bereits registriert',
					};
				}
				if (existing.username === data.username) {
					return { success: false, error: 'Benutzername bereits vergeben' };
				}
			}

			// Passwort hashen
			const salt = AuthService.generateSalt();
			const passwordHash = AuthService.hashPassword(data.password, salt);

			// Benutzer erstellen
			const newUser: NewUser = {
				email: data.email,
				username: data.username,
				firstName: data.firstName,
				lastName: data.lastName,
				passwordHash,
				salt,
				isActive: true,
				isEmailVerified: false,
				settings: {
					theme: 'system',
					language: 'de',
					timezone: 'Europe/Berlin',
					notifications: true,
				},
			};

			const [createdUser] = await this.db
				.insert(users)
				.values(newUser)
				.returning();

			// Passwort-Hash aus Response entfernen
			const { passwordHash: _, salt: __, ...userWithoutPassword } = createdUser;

			return {
				success: true,
				user: userWithoutPassword as User,
			};
		} catch (error) {
			console.error('Registrierungsfehler:', error);
			return {
				success: false,
				error: 'Registrierung fehlgeschlagen',
			};
		}
	}

	/**
	 * Benutzer anmelden
	 */
	async login(credentials: LoginCredentials): Promise<AuthResult> {
		try {
			// Benutzer suchen
			const [user] = await this.db
				.select()
				.from(users)
				.where(eq(users.email, credentials.email))
				.limit(1);

			if (!user) {
				return { success: false, error: 'Ungültige E-Mail oder Passwort' };
			}

			if (!user.isActive) {
				return { success: false, error: 'Konto ist deaktiviert' };
			}

			// Passwort prüfen
			const hashedPassword = AuthService.hashPassword(
				credentials.password,
				user.salt,
			);
			if (hashedPassword !== user.passwordHash) {
				return { success: false, error: 'Ungültige E-Mail oder Passwort' };
			}

			// Letzten Login aktualisieren
			await this.db
				.update(users)
				.set({
					lastLoginAt: new Date(),
					lastActiveAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(users.id, user.id));

			// Passwort-Hash aus Response entfernen
			const { passwordHash: _, salt: __, ...userWithoutPassword } = user;

			return {
				success: true,
				user: userWithoutPassword as User,
			};
		} catch (error) {
			console.error('Login-Fehler:', error);
			return {
				success: false,
				error: 'Anmeldung fehlgeschlagen',
			};
		}
	}

	/**
	 * Benutzer nach ID suchen
	 */
	async getUserById(id: number): Promise<User | null> {
		try {
			const [user] = await this.db
				.select()
				.from(users)
				.where(eq(users.id, id))
				.limit(1);

			if (!user) {
				return null;
			}

			// Passwort-Hash aus Response entfernen
			const { passwordHash: _, salt: __, ...userWithoutPassword } = user;
			return userWithoutPassword as User;
		} catch (error) {
			console.error('Fehler beim Laden des Benutzers:', error);
			return null;
		}
	}

	/**
	 * Benutzer-Einstellungen aktualisieren
	 */
	async updateUserSettings(
		userId: number,
		settings: Partial<NonNullable<User['settings']>>,
	): Promise<boolean> {
		try {
			const [user] = await this.db
				.select({ settings: users.settings })
				.from(users)
				.where(eq(users.id, userId))
				.limit(1);

			if (!user) {
				return false;
			}

			const updatedSettings = {
				...user.settings,
				...settings,
			};

			await this.db
				.update(users)
				.set({
					settings: updatedSettings,
					updatedAt: new Date(),
				})
				.where(eq(users.id, userId));

			return true;
		} catch (error) {
			console.error('Fehler beim Aktualisieren der Einstellungen:', error);
			return false;
		}
	}

	/**
	 * Passwort ändern
	 */
	async changePassword(
		userId: number,
		currentPassword: string,
		newPassword: string,
	): Promise<AuthResult> {
		try {
			// Aktuellen Benutzer laden
			const [user] = await this.db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.limit(1);

			if (!user) {
				return { success: false, error: 'Benutzer nicht gefunden' };
			}

			// Aktuelles Passwort prüfen
			const hashedCurrentPassword = AuthService.hashPassword(
				currentPassword,
				user.salt,
			);
			if (hashedCurrentPassword !== user.passwordHash) {
				return { success: false, error: 'Aktuelles Passwort ist falsch' };
			}

			// Neues Passwort hashen
			const newSalt = AuthService.generateSalt();
			const newPasswordHash = AuthService.hashPassword(newPassword, newSalt);

			// Passwort aktualisieren
			await this.db
				.update(users)
				.set({
					passwordHash: newPasswordHash,
					salt: newSalt,
					updatedAt: new Date(),
				})
				.where(eq(users.id, userId));

			return { success: true };
		} catch (error) {
			console.error('Fehler beim Ändern des Passworts:', error);
			return { success: false, error: 'Passwort konnte nicht geändert werden' };
		}
	}

	/**
	 * Benutzer-Profil aktualisieren
	 */
	async updateProfile(
		userId: number,
		profile: {
			firstName?: string;
			lastName?: string;
			username?: string;
		},
	): Promise<AuthResult> {
		try {
			// Prüfen ob neuer Username bereits existiert
			if (profile.username) {
				const [existingUser] = await this.db
					.select()
					.from(users)
					.where(eq(users.username, profile.username))
					.limit(1);

				if (existingUser && existingUser.id !== userId) {
					return { success: false, error: 'Benutzername bereits vergeben' };
				}
			}

			// Profil aktualisieren
			const [updatedUser] = await this.db
				.update(users)
				.set({
					...profile,
					updatedAt: new Date(),
				})
				.where(eq(users.id, userId))
				.returning();

			// Passwort-Hash aus Response entfernen
			const { passwordHash: _, salt: __, ...userWithoutPassword } = updatedUser;

			return {
				success: true,
				user: userWithoutPassword as User,
			};
		} catch (error) {
			console.error('Fehler beim Aktualisieren des Profils:', error);
			return {
				success: false,
				error: 'Profil konnte nicht aktualisiert werden',
			};
		}
	}
}

// Singleton Instance
export const authService = new AuthService();
