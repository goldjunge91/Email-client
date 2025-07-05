/**
 * Renderer-side encryption service that communicates with main process
 * This avoids the need for crypto polyfills in the browser
 */
export class EncryptionService {
	/**
	 * Encrypt a string value using the main process
	 */
	static async encrypt(text: string): Promise<string> {
		const result = await window.electronAPI.invoke('crypto:encrypt', text);
		if (result.success) {
			return result.encrypted;
		}
		throw new Error(result.error || 'Failed to encrypt data');
	}

	/**
	 * Decrypt a string value using the main process
	 */
	static async decrypt(encryptedText: string): Promise<string> {
		const result = await window.electronAPI.invoke(
			'crypto:decrypt',
			encryptedText,
		);
		if (result.success) {
			return result.decrypted;
		}
		throw new Error(result.error || 'Failed to decrypt data');
	}

	/**
	 * Check if a string appears to be encrypted
	 */
	static async isEncrypted(text: string): Promise<boolean> {
		const result = await window.electronAPI.invoke('crypto:is-encrypted', text);
		if (result.success) {
			return result.isEncrypted;
		}
		throw new Error(result.error || 'Failed to check encryption status');
	}
}
