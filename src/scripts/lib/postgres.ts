/** Local PostgreSQL process lifecycle. All commands target this checkout's Nix service. */
import { execFile } from 'node:child_process';
import { mkdir, readFile, realpath, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { Client } from 'pg';

const exec = promisify(execFile);
/** Checkout directory, independent of the caller's current directory. */
const projectRoot = fileURLToPath(new URL('../../../', import.meta.url));
const stateDir = new URL('../../../.direnv/', import.meta.url);
const lockDir = new URL('pg-control.lock/', stateDir);

/** Serialize startup, database management, stop, and reset across local callers. Stale locks require manual removal. */
export async function withControlLock<T>(fn: () => Promise<T>): Promise<T> {
  await mkdir(stateDir, { recursive: true });
  const deadline = Date.now() + 120_000;
  for (;;) {
    try {
      await mkdir(lockDir);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      if (Date.now() >= deadline)
        throw new Error('Timed out waiting for .direnv/pg-control.lock; check other callers or remove a stale lock.');
      await delay(100);
    }
  }
  try {
    return await fn();
  } finally {
    await rm(lockDir, { recursive: true });
  }
}

/** Run the pinned Process Compose wrapper with a bounded execution time. */
async function processCompose(...args: string[]): Promise<string> {
  const { stdout } = await exec('nix', ['run', '.#pg', '--', ...args], {
    cwd: projectRoot,
    timeout: 120_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  return stdout;
}

/** Read the local manager state, returning null only when its socket is absent or refused. */
export async function postgresStatus(): Promise<{ name: string; is_running: boolean; exit_code: number }[] | null> {
  // Only an absent/refused socket means the manager is down. Nix and configuration errors propagate.
  try {
    return JSON.parse(await processCompose('process', 'list', '-o', 'json'));
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr ?? '';
    if (/dial unix.*(?:no such file|connection refused)/is.test(stderr)) return null;
    throw error;
  }
}

/** Start the service if necessary and wait for SQL readiness. Call while holding the control lock. */
export async function ensurePostgres(): Promise<void> {
  const status = await postgresStatus();
  if (status === null) {
    await processCompose('up', '-D', '--log-file', '.direnv/pg-process-compose.log');
  } else if (!status.find((entry) => entry.name === 'pg')?.is_running) {
    if (status.some((entry) => entry.exit_code !== 0)) {
      throw new Error('PostgreSQL process failed; inspect .direnv/pg-process-compose.log.');
    }
    await processCompose('process', 'start', 'pg');
  }
  const deadline = Date.now() + 30_000;
  for (;;) {
    const client = new Client({ database: 'postgres', connectionTimeoutMillis: 1000 });
    try {
      await client.connect();
      const result = await client.query('SHOW data_directory');
      if ((await realpath(result.rows[0].data_directory)) !== (await realpath(new URL('pg/', stateDir)))) {
        throw new Error('The configured connection belongs to another PostgreSQL cluster.');
      }
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (!['ECONNREFUSED', '57P03', 'ECONNRESET'].includes(code ?? '') || Date.now() >= deadline) {
        throw new Error('PostgreSQL is unavailable; inspect .direnv/pg-process-compose.log.', { cause: error });
      }
    } finally {
      await client.end();
    }
    await delay(200);
  }
}

/** Stop the manager and wait for this cluster's postmaster to exit before returning. Call under the control lock. */
export async function stopPostgres(): Promise<void> {
  if (await postgresStatus()) await processCompose('down');
  const deadline = Date.now() + 30_000;
  for (;;) {
    let pid: number;
    try {
      pid = Number((await readFile(new URL('pg/postmaster.pid', stateDir), 'utf8')).split('\n')[0]);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
    if (!Number.isInteger(pid) || pid <= 0) throw new Error('Invalid PostgreSQL PID file; refusing to remove data.');
    try {
      process.kill(pid, 0);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ESRCH') return;
      throw error;
    }
    if (Date.now() >= deadline) throw new Error('PostgreSQL is still running; refusing to remove data.');
    await delay(100);
  }
}
