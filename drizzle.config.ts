import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit configuration for the PostgreSQL schema in `src/lib/server/db/schema.ts`, writing migrations to
 * `migrations/` with verbose and strict schema operations. It connects with the `PG*` environment variables, read when
 * this file is evaluated; `PGSSLMODE=disable` turns SSL off, otherwise the driver default applies.
 */
export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
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
