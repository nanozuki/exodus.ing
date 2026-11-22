import { ensureDatabase, resetDatabase } from './lib/database';
import { postgresStatus, stopPostgres, withControlLock } from './lib/postgres';

// pg.ts is the checkout-local PostgreSQL CLI and runs its command from `process.argv` when evaluated. `start <name>`
// ensures the `exodus-<name>` clone; `reset <name|template>` deletes the named database, or every exodus database for
// `template`; `stop` stops PostgreSQL under the control lock; `status` prints the process list as JSON, or
// `{ "status": "Stopped" }`. Any other form, including extra arguments, throws the usage message; failures propagate
// to the process.

const [command, name, ...extra] = process.argv.slice(2);

if (command === 'start' && name && extra.length === 0) {
  await ensureDatabase(name);
} else if (command === 'reset' && name && extra.length === 0) {
  await resetDatabase(name);
} else if (command === 'stop' && !name) {
  await withControlLock(stopPostgres);
} else if (command === 'status' && !name) {
  console.log(JSON.stringify((await postgresStatus()) ?? { status: 'Stopped' }, null, 2));
} else {
  throw new Error('Usage: tsx src/scripts/pg.ts start <name> | status | stop | reset <name|template>');
}
