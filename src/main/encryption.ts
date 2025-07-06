import { createCipher, createDecipher, randomBytes } from 'crypto';

/**
 * Encryption service für den Main-Prozess (Node.js-Kontext).
 *
 * Gegenstelle:
 *   - IPC-Handler: {@link ../ipc/encryption.ts} (stellt die Methoden per IPC bereit)
 *   - Renderer: {@link ../../renderer/utils/encryption.ts} (nutzt die Methoden via IPC)
 *
 * Diese Klasse implementiert AES-256-CBC Verschlüsselung/Entschlüsselung und wird ausschließlich im Main-Prozess verwendet.
 * Der Schlüssel sollte in Produktion sicher verwaltet werden (z.B. Umgebungsvariable).
 * Funktion:
 *   Bietet Methoden zum Verschlüsseln, Entschlüsseln und Prüfen von Strings im Main-Prozess. Die Methoden werden über IPC für den Renderer bereitgestellt und nutzen AES-256-CBC.
 *   Der Schlüssel sollte in Produktion sicher verwaltet werden (z.B. Umgebungsvariable).
 *
 * Öffentliche Methoden:
 *
 *   encrypt(text: string): string
 *     Verschlüsselt einen String.
 *     @param text   Der zu verschlüsselnde Klartext
 *     @returns      Der verschlüsselte String (Format: IV:Ciphertext)
 *
 *   decrypt(encryptedText: string): string
 *     Entschlüsselt einen String.
 *     @param encryptedText   Der verschlüsselte String (Format: IV:Ciphertext)
 *     @returns               Der entschlüsselte Klartext
 *
 *   generateKey(): string
 *     Generiert einen zufälligen Schlüssel (hex-codiert).
 *     @returns   Neuer Schlüssel (hex)
 *
 *   isEncrypted(text: string): boolean
 *     Prüft, ob ein String verschlüsselt aussieht (Heuristik, keine Garantie).
 *     @param text   Der zu prüfende String
 *     @returns      true, wenn vermutlich verschlüsselt
 */
export class EncryptionService {
	private static readonly ALGORITHM = 'aes-256-cbc';

	private static readonly KEY_LENGTH = 32;

	private static readonly IV_LENGTH = 16;

	// In production, this key should be stored securely (environment variable, secure key management)
	private static readonly ENCRYPTION_KEY =
		process.env.ENCRYPTION_KEY ||
		'your-32-character-secret-key-here-change-this-in-production';

	/**
	 * Encrypt a string value
	 */
	static encrypt(text: string): string {
		try {
			const iv = randomBytes(this.IV_LENGTH);
			const cipher = createCipher(this.ALGORITHM, this.ENCRYPTION_KEY);

			let encrypted = cipher.update(text, 'utf8', 'hex');
			encrypted += cipher.final('hex');

			// Combine IV and encrypted data
			return `${iv.toString('hex')}:${encrypted}`;
		} catch (error) {
			throw new Error('Failed to encrypt data', { cause: error });
		}
	}

	/**
	 * Decrypt a string value
	 */
	static decrypt(encryptedText: string): string {
		try {
			const parts = encryptedText.split(':');
			if (parts.length !== 2) {
				throw new Error('Invalid encrypted data format');
			}

			const decipher = createDecipher(this.ALGORITHM, this.ENCRYPTION_KEY);

			let decrypted = decipher.update(parts[1], 'hex', 'utf8');
			decrypted += decipher.final('utf8');

			return decrypted;
		} catch (error) {
			throw new Error('Failed to decrypt data', { cause: error });
		}
	}

	/**
	 * Generate a random key for encryption (for setup/initialization)
	 */
	static generateKey(): string {
		return randomBytes(this.KEY_LENGTH).toString('hex');
	}

	/**
	 * Check if a string appears to be encrypted (basic check)
	 */
	static isEncrypted(text: string): boolean {
		return text.includes(':') && text.length > 32;
	}
}
