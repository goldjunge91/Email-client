/**
 * Sicherer Storage-Wrapper für den Renderer-Prozess.
 *
 * Gegenstellen:
 *   - Verschlüsselung: {@link ./encryption.ts} (nutzt die IPC-Methoden für Krypto)
 *   - Main-Prozess: {@link ../../main/ipc/encryption.ts} (stellt die Krypto-Methoden bereit)
 *
 * Funktion:
 *   Speichert beliebige Daten im localStorage und verschlüsselt dabei automatisch alle sensiblen Felder (z.B. Passwort, Token, Secret, Key, Auth). Entschlüsselt diese Felder beim Auslesen wieder automatisch. Nutzt dazu die Verschlüsselungs-IPC-Methoden, die im Main-Prozess implementiert sind.
 *
 * Öffentliche Methoden:
 *
 *   store(key: string, data: any): Promise<void>
 *     Speichert ein beliebiges Objekt unter dem gegebenen Schlüssel. Sensible Felder werden verschlüsselt.
 *     @param key   Der localStorage-Schlüssel
 *     @param data  Das zu speichernde Objekt (beliebige Struktur)
 *
 *   retrieve(key: string): Promise<any>
 *     Lädt ein Objekt aus dem localStorage und entschlüsselt sensible Felder automatisch.
 *     @param key   Der localStorage-Schlüssel
 *     @returns     Das gespeicherte Objekt oder null
 *
 *   remove(key: string): void
 *     Entfernt einen Eintrag aus dem localStorage.
 *     @param key   Der localStorage-Schlüssel
 */
export class SecureStorage {
	private static sensitiveFields = new Set([
		'password',
		'token',
		'secret',
		'key',
		'auth',
	]);

	/**
	 * Store data with automatic encryption of sensitive fields
	 */
	static async store(key: string, data: any): Promise<void> {
		try {
			const processedData = await this.encryptSensitiveFields(data);
			localStorage.setItem(key, JSON.stringify(processedData));
		} catch {
			throw new Error('Failed to store secure data');
		}
	}

	/**
	 * Retrieve data with automatic decryption of sensitive fields
	 */
	static async retrieve(key: string): Promise<any> {
		try {
			const storedData = localStorage.getItem(key);
			if (!storedData) return null;

			const data = JSON.parse(storedData);
			return await this.decryptSensitiveFields(data);
		} catch {
			return null;
		}
	}

	/**
	 * Remove data from storage
	 */
	static remove(key: string): void {
		localStorage.removeItem(key);
	}

	/**
	 * Recursively encrypt sensitive fields in an object
	 */
	private static async encryptSensitiveFields(obj: any): Promise<any> {
		if (obj === null || typeof obj !== 'object') {
			return obj;
		}

		if (Array.isArray(obj)) {
			const promises = obj.map((item) => this.encryptSensitiveFields(item));
			return Promise.all(promises);
		}

		const result: any = {};
		const promises = Object.entries(obj).map(async ([key, value]) => {
			if (this.isSensitiveField(key) && typeof value === 'string') {
				result[key] = await this.encrypt(value);
			} else if (typeof value === 'object') {
				result[key] = await this.encryptSensitiveFields(value);
			} else {
				result[key] = value;
			}
		});

		await Promise.all(promises);
		return result;
	}

	/**
	 * Recursively decrypt sensitive fields in an object
	 */
	private static async decryptSensitiveFields(obj: any): Promise<any> {
		if (obj === null || typeof obj !== 'object') {
			return obj;
		}

		if (Array.isArray(obj)) {
			const promises = obj.map((item) => this.decryptSensitiveFields(item));
			return Promise.all(promises);
		}

		const result: any = {};
		const promises = Object.entries(obj).map(async ([key, value]) => {
			if (
				this.isSensitiveField(key) &&
				typeof value === 'string' &&
				(await this.isEncrypted(value))
			) {
				try {
					result[key] = await this.decrypt(value);
				} catch {
					// If decryption fails, keep original value
					result[key] = value;
				}
			} else if (typeof value === 'object') {
				result[key] = await this.decryptSensitiveFields(value);
			} else {
				result[key] = value;
			}
		});

		await Promise.all(promises);
		return result;
	}

	/**
	 * Check if a field name indicates sensitive data
	 */
	private static isSensitiveField(fieldName: string): boolean {
		const lowerField = fieldName.toLowerCase();
		return Array.from(this.sensitiveFields).some((sensitive) =>
			lowerField.includes(sensitive),
		);
	}

	/**
	 * Encrypt a string value using the main process
	 */
	private static async encrypt(text: string): Promise<string> {
		const result = await window.electron.invoke('crypto:encrypt', text);
		if (result.success) {
			return result.encrypted;
		}
		throw new Error(result.error || 'Failed to encrypt data');
	}

	/**
	 * Decrypt a string value using the main process
	 */
	private static async decrypt(encryptedText: string): Promise<string> {
		const result = await window.electron.invoke(
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
	private static async isEncrypted(text: string): Promise<boolean> {
		const result = await window.electron.invoke('crypto:is-encrypted', text);
		if (result.success) {
			return result.isEncrypted;
		}
		throw new Error(result.error || 'Failed to check encryption status');
	}
}
