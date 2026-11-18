import { defineConfig } from 'drizzle-kit';

import baseConfig from './drizzle.config';

// Targets the production database through `pnpm db:push:prod`. The connection
// comes only from PRODUCTION_DATABASE_URL, which must include the host, user,
// password, and database: pg fills omitted URL parts from the local PG*
// variables that the devShell exports.
const productionUrl = process.env.PRODUCTION_DATABASE_URL;
if (!productionUrl) {
  throw new Error('PRODUCTION_DATABASE_URL is not set');
}

// Provider URLs often omit the default port, which pg would otherwise take
// from the local PGPORT.
const url = new URL(productionUrl);
url.port ||= '5432';

export default defineConfig({
  ...baseConfig,
  dbCredentials: { url: url.toString() },
});
