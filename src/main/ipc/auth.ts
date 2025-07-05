import { ipcMain } from 'electron';
import { authService } from '../database/services/authService';

/**
 * IPC handlers for authentication operations
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
