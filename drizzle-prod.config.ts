import { defineConfig } from 'drizzle-kit';
import { z } from 'zod';

import baseConfig from './drizzle.config';

// Targets the production database through `pnpm db:push:prod`. The connection
// comes only from PRODUCTION_DATABASE_URL, which must include the host, user,
// password, and database; loading the config throws otherwise. The port
// defaults to 5432. TLS is off unless the URL sets `sslmode` to `require`,
// `verify-ca`, or `verify-full`, all of which verify the server certificate.
// Other query parameters are ignored.

// pg fills every connection setting the config leaves unset from the local PG*
// variables that the devShell exports, so each one is passed explicitly.
const productionDatabaseUrl = z
  .url({ protocol: /^postgres(ql)?$/ })
  .transform((value) => {
    const url = new URL(value);
    return {
      host: url.hostname,
      port: Number(url.port || 5432),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.slice(1)),
      ssl: url.searchParams.get('sslmode') ?? 'disable',
    };
  })
  .pipe(
    z.object({
      host: z.string().min(1),
      port: z.number().int(),
      user: z.string().min(1),
      password: z.string().min(1),
      database: z.string().min(1),
      // drizzle-kit maps `require` to an unverified connection, while pg 8
      // treats it as `verify-full`; keep the verifying behavior the URL had
      // under pg.
      ssl: z
        .enum(['disable', 'require', 'verify-ca', 'verify-full'])
        .transform((mode) => (mode === 'disable' ? false : ('verify-full' as const))),
    }),
  );

const result = productionDatabaseUrl.safeParse(process.env.PRODUCTION_DATABASE_URL);
if (!result.success) {
  throw new Error(`Invalid PRODUCTION_DATABASE_URL:\n${z.prettifyError(result.error)}`);
}

export default defineConfig({
  ...baseConfig,
  dialect: 'postgresql',
  dbCredentials: result.data,
});
