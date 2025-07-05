/* eslint-disable no-console */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as schema from './schema';

// Lade Umgebungsvariablen
dotenv.config({ path: '.env.local' });

class DatabaseConnection {
	private pool: Pool;

	private db: ReturnType<typeof drizzle>;

	// eslint-disable-next-line no-use-before-define
	private static instance: DatabaseConnection;

	private constructor() {
		// Erstelle PostgreSQL Pool
		this.pool = new Pool({
			host: process.env.DB_HOST || 'localhost',
			port: parseInt(process.env.DB_PORT || '5432', 10),
			user: process.env.DB_USER || 'mailapp',
			password: process.env.DB_PASSWORD || 'dev_password_123',
			database: process.env.DB_NAME || 'mailapp_db',
			ssl:
				process.env.NODE_ENV === 'production'
					? { rejectUnauthorized: false }
					: false,
			max: 20, // Maximum Anzahl von Verbindungen im Pool
			idleTimeoutMillis: 30000,
			connectionTimeoutMillis: 2000,
		});

		// Erstelle Drizzle Instanz
		this.db = drizzle(this.pool, { schema, logger: true });

		// Pool Events
		this.pool.on('connect', () => {
			console.log('📦 Neue Datenbankverbindung hergestellt');
		});

		this.pool.on('error', (err) => {
			console.error('❌ Datenbankverbindungsfehler:', err);
		});
	}

	public static getInstance(): DatabaseConnection {
		if (!DatabaseConnection.instance) {
			DatabaseConnection.instance = new DatabaseConnection();
		}
		return DatabaseConnection.instance;
	}

	public getDb() {
		return this.db;
	}

	public async testConnection(): Promise<boolean> {
		try {
			const client = await this.pool.connect();
			await client.query('SELECT NOW()');
			client.release();
			console.log('✅ Datenbankverbindung erfolgreich getestet');
			return true;
		} catch (error) {
			console.error('❌ Datenbankverbindungstest fehlgeschlagen:', error);
			return false;
		}
	}

	public async close(): Promise<void> {
		try {
			await this.pool.end();
			console.log('🔒 Datenbankverbindungen geschlossen');
		} catch (error) {
			console.error(
				'❌ Fehler beim Schließen der Datenbankverbindungen:',
				error,
			);
		}
	}

	// Health Check für die Datenbank
	public async healthCheck(): Promise<{
		status: 'healthy' | 'unhealthy';
		totalConnections: number;
		idleConnections: number;
		waitingClients: number;
	}> {
		try {
			const totalConnections = this.pool.totalCount;
			const idleConnections = this.pool.idleCount;
			const waitingClients = this.pool.waitingCount;

			// Teste eine einfache Query
			const client = await this.pool.connect();
			await client.query('SELECT 1');
			client.release();

			return {
				status: 'healthy',
				totalConnections,
				idleConnections,
				waitingClients,
			};
		} catch (error) {
			console.error('Datenbank Health Check fehlgeschlagen:', error);
			return {
				status: 'unhealthy',
				totalConnections: this.pool.totalCount,
				idleConnections: this.pool.idleCount,
				waitingClients: this.pool.waitingCount,
			};
		}
	}
}

// Exportiere Singleton-Instanz
export const dbConnection = DatabaseConnection.getInstance();
export const db = dbConnection.getDb();

// Helper function for getting database instance
export const getDatabase = () => dbConnection.getDb();

// Exportiere Schema für externe Nutzung
export * from './schema';
