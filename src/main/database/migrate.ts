/* eslint-disable no-console */
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { dbConnection, db } from './connection';

async function runMigrations() {
	try {
		console.log('🚀 Starte Datenbank-Migrationen...');

		// Teste Verbindung
		const isConnected = await dbConnection.testConnection();
		if (!isConnected) {
			throw new Error('Keine Datenbankverbindung verfügbar');
		}

		// Führe Migrationen aus
		await migrate(db, { migrationsFolder: './src/main/database/migrations' });

		console.log('✅ Alle Migrationen erfolgreich ausgeführt');
	} catch (error) {
		console.error('❌ Migration fehlgeschlagen:', error);
		process.exit(1);
	}
}

// Führe Migrationen aus wenn direkt aufgerufen
if (require.main === module) {
	runMigrations()
		.then(() => {
			console.log('🎉 Migration abgeschlossen');
			process.exit(0);
		})
		.catch((error) => {
			console.error('💥 Migration fehlgeschlagen:', error);
			process.exit(1);
		});
}

export { runMigrations };
