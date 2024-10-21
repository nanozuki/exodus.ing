import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/server/repository/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
});
