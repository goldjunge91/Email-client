import { ipcMain } from 'electron';
import { authService } from '../database/services/authService';

/**
 * IPC-Handler für Authentifizierungsoperationen im Main-Prozess.
 *
 * Gegenstellen:
 *   - Renderer: Authentifizierungs-UI und Logik im Renderer-Prozess (z.B. Login-Formulare, Registrierung, Profilverwaltung)
 *   - Service: {@link ../database/services/authService} (führt die eigentliche Authentifizierungslogik aus)
 *
 * Funktion:
 *   Stellt IPC-Handler für alle Authentifizierungs- und Benutzerverwaltungs-Operationen bereit. Diese Methoden werden vom Renderer-Prozess über IPC aufgerufen und führen die Authentifizierungslogik im Main-Prozess aus.
 *
 * Öffentliche Methoden (IPC-Handler):
 *
 *   'auth:register' (userData: { name: string; email: string; password: string }):
 *     Registriert einen neuen Benutzer.
 *     @param userData   Objekt mit name, email, password
 *     @returns          { success: true, user } oder { success: false, error }
 *
 *   'auth:login' (credentials: { email: string; password: string }):
 *     Meldet einen Benutzer an.
 *     @param credentials   Objekt mit email, password
 *     @returns             { success: true, user } oder { success: false, error }
 *
 *   'auth:get-user' (userId: number):
 *     Holt einen Benutzer anhand der ID.
 *     @param userId   Die User-ID
 *     @returns        { success: true, user } oder { success: false, error }
 *
 *   'auth:update-profile' (userId: number, updates: { name?: string; email?: string }):
 *     Aktualisiert das Benutzerprofil.
 *     @param userId   Die User-ID
 *     @param updates  Objekt mit optional name und email
 *     @returns        { success: true, user } oder { success: false, error }
 *
 *   'auth:change-password' (userId: number, data: { currentPassword: string; newPassword: string }):
 *     Ändert das Benutzerpasswort.
 *     @param userId   Die User-ID
 *     @param data     Objekt mit currentPassword, newPassword
 *     @returns        { success: true } oder { success: false, error }
 *
 *   'auth:delete-account' (userId: number, password: string):
 *     Löscht das Benutzerkonto.
 *     @param userId   Die User-ID
 *     @param password Das aktuelle Passwort
 *     @returns        { success: true } oder { success: false, error }
 */
export function initializeAuthIPC(): void {
	// Register user
	ipcMain.handle(
		'auth:register',
		async (
			_event,
			userData: {
				name: string;
				email: string;
				password: string;
			},
		) => {
			try {
				const user = await authService.register(userData);
				return { success: true, user };
			} catch (error) {
				return { success: false, error: (error as Error).message };
			}
		},
	);

	// Login user
	ipcMain.handle(
		'auth:login',
		async (
			_event,
			credentials: {
				email: string;
				password: string;
			},
		) => {
			try {
				const user = await authService.login(
					credentials.email,
					credentials.password,
				);
				return { success: true, user };
			} catch (error) {
				return { success: false, error: (error as Error).message };
			}
		},
	);

	// Get user by ID
	ipcMain.handle('auth:get-user', async (_event, userId: number) => {
		try {
			const user = await authService.getUserById(userId);
			return { success: true, user };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	});

	// Update user profile
	ipcMain.handle(
		'auth:update-profile',
		async (
			_event,
			userId: number,
			updates: {
				name?: string;
				email?: string;
			},
		) => {
			try {
				const user = await authService.updateProfile(userId, updates);
				return { success: true, user };
			} catch (error) {
				return { success: false, error: (error as Error).message };
			}
		},
	);

	// Change password
	ipcMain.handle(
		'auth:change-password',
		async (
			_event,
			userId: number,
			data: {
				currentPassword: string;
				newPassword: string;
			},
		) => {
			try {
				await authService.changePassword(
					userId,
					data.currentPassword,
					data.newPassword,
				);
				return { success: true };
			} catch (error) {
				return { success: false, error: (error as Error).message };
			}
		},
	);

	// Delete user account
	ipcMain.handle(
		'auth:delete-account',
		async (_event, userId: number, password: string) => {
			try {
				await authService.deleteAccount(userId, password);
				return { success: true };
			} catch (error) {
				return { success: false, error: (error as Error).message };
			}
		},
	);
}
