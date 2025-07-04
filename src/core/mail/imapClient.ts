import Imap from 'node-imap';

/**
 * Account-Daten Interface
 * Definiert die Struktur der Daten, die wir vom AccountForm erhalten.
 */
export interface Account {
	username: string;
	password: string;
	server: string;
	port: number;
	ssl: boolean;
}

/**
 * Stellt eine Verbindung zum IMAP-Server her und verifiziert die Zugangsdaten.
 * @param account - Ein Objekt mit den Account-Daten.
 * @returns - Ein Promise, das bei erfolgreicher Verbindung aufgelöst (`resolve`)
 * und bei einem Fehler zurückgewiesen (`reject`) wird.
 */
export const verifyImapConnection = (account: Account): Promise<void> => {
	return new Promise((resolve, reject) => {
		// 1. IMAP-Client-Instanz mit den Nutzerdaten erstellen
		const imap = new Imap({
			user: account.username,
			password: account.password,
			host: account.server,
			port: account.port,
			tls: account.ssl,
			tlsOptions: {
				rejectUnauthorized: false, // Wichtig für lokale/selbst-signierte Zertifikate
			},
		});

		// 2. Event-Listener für erfolgreiche Verbindung
		imap.once('ready', () => {
			// eslint-disable-next-line no-console
			console.log('IMAP-Verbindung erfolgreich hergestellt!');
			imap.end(); // Verbindung sofort wieder schließen, da wir nur testen
			resolve(); // Promise erfolgreich auflösen
		});

		// 3. Event-Listener für Fehler
		imap.once('error', (err: Error) => {
			// eslint-disable-next-line no-console
			console.error('IMAP-Verbindungsfehler:', err.message);
			reject(err); // Promise mit dem Fehler zurückweisen
		});

		// 4. Verbindung herstellen
		imap.connect();
	});
};
