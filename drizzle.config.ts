import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
  schema: './src/lib/server/repositories/schema.ts',
  out: './migrations',
  verbose: true,
  dialect: 'sqlite',
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
});
