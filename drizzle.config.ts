import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/server/repositories/schema.ts',
  out: './migrations',
  verbose: true,
  dialect: 'postgresql',
  dbCredentials: {
    ssl: process.env.PGSSLMODE === 'disable' ? false : undefined,
    host: process.env.PGHOST!,
    port: Number(process.env.PGPORT),
    user: process.env.PGUSER!,
    password: process.env.PGPASSWORD!,
    database: process.env.PGDATABASE!,
  },
  strict: true,
});
