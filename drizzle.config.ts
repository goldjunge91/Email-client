import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Lade Umgebungsvariablen
dotenv.config({ path: '.env.local' });

export default defineConfig({
	schema: './src/main/database/schema.ts',
	out: './src/main/database/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
	verbose: true,
	strict: true,
});
