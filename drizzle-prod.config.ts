import { defineConfig } from 'drizzle-kit';

import baseConfig from './drizzle.config';

// Targets the production database through `pnpm db:push:prod`. The connection
// comes only from PRODUCTION_DATABASE_URL, which must include the host, user,
// password, and database; loading the config throws otherwise.
const productionUrl = process.env.PRODUCTION_DATABASE_URL;
if (!productionUrl) {
  throw new Error('PRODUCTION_DATABASE_URL is not set');
}

// pg fills omitted URL parts from the local PG* variables that the devShell
// exports, so a partial URL could silently mix in or target the local database.
const url = new URL(productionUrl);
const missing = Object.entries({
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
})
  .filter(([, value]) => !value)
  .map(([part]) => part);
if (missing.length > 0) {
  throw new Error(`PRODUCTION_DATABASE_URL is missing: ${missing.join(', ')}`);
}

// Provider URLs often omit the default port, which is filled here for the same
// reason.
url.port ||= '5432';

export default defineConfig({
  ...baseConfig,
  dbCredentials: { url: url.toString() },
});
