import { defineConfig } from 'drizzle-kit';
import { z } from 'zod';

import baseConfig from './drizzle.config';

// Config for `pnpm db:push:prod`. Set PRODUCTION_DATABASE_URL to the
// provider's connection URL.
//
// node-postgres (`pg`) fills any connection setting missing from a URL with the
// matching PG* environment variable, so make sure the URL defines every part.
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
