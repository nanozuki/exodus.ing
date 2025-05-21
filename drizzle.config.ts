import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/server/repositories/schema.ts',
  out: './migrations',
  verbose: true,
  dialect: 'sqlite',
  dbCredentials: { url: process.env.EXODUSING_DATABASE! },
  strict: true,
});
