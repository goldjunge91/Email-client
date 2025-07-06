/* eslint-disable import/no-extraneous-dependencies */
import { ipcMain } from 'electron';
import { EncryptionService } from '../encryption';

/**
 * IPC handlers for encryption operations
 */
export function initializeEncryptionIPC(): void {
	// Encrypt data
	ipcMain.handle('crypto:encrypt', async (_event, text: string) => {
		try {
			const encrypted = EncryptionService.encrypt(text);
			return { success: true, encrypted };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	});

	// Decrypt data
	ipcMain.handle('crypto:decrypt', async (_event, encryptedText: string) => {
		try {
			const decrypted = EncryptionService.decrypt(encryptedText);
			return { success: true, decrypted };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	});

	// Check if data is encrypted
	ipcMain.handle('crypto:is-encrypted', async (_event, text: string) => {
		try {
			const isEncrypted = EncryptionService.isEncrypted(text);
			return { success: true, isEncrypted };
		} catch (error) {
			return { success: false, error: (error as Error).message };
		}
	});
}
