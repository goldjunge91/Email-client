/**
 * Renderer-seitiger Verschlüsselungsservice, der per IPC mit dem Main-Prozess kommuniziert.
 *
 * Gegenstellen:
 *   - IPC-Handler: {@link ../../../main/ipc/encryption.ts} (stellt die Methoden bereit)
 *   - Implementierung: {@link ../../../main/encryption.ts} (führt die Krypto-Logik aus)
 *
 * Funktion:
 *   Bietet Methoden zum Verschlüsseln, Entschlüsseln und Prüfen von Strings im Renderer-Prozess, indem die eigentliche Krypto-Logik sicher im Main-Prozess ausgeführt wird (via IPC).
 *
 * Öffentliche Methoden:
 *
 *   encrypt(text: string): Promise<string>
 *     Verschlüsselt einen String über den Main-Prozess.
 *     @param text   Der zu verschlüsselnde Klartext
 *     @returns      Der verschlüsselte String
 *
 *   decrypt(encryptedText: string): Promise<string>
 *     Entschlüsselt einen String über den Main-Prozess.
 *     @param encryptedText   Der verschlüsselte String
 *     @returns               Der entschlüsselte Klartext
 *
 *   isEncrypted(text: string): Promise<boolean>
 *     Prüft, ob ein String verschlüsselt aussieht (Heuristik, keine Garantie).
 *     @param text   Der zu prüfende String
 *     @returns      true, wenn vermutlich verschlüsselt
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
