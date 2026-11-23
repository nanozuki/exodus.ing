import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const lock = new URL('../../.direnv/e2e-suite.lock/', import.meta.url);
const ownerFile = new URL('owner', lock);
const tokenKey = 'EXODUS_E2E_LOCK_TOKEN';

/**
 * Synchronously acquires the checkout's `.direnv/e2e-suite.lock` before Playwright clears output. The new owner records
 * its PID and token and exports the token as `EXODUS_E2E_LOCK_TOKEN`, so discovery subprocesses and workers pass when
 * the owner file holds their inherited token; only the owning process releases the lock, on exit. An existing lock
 * throws without touching output, and missing or malformed ownership grants nothing. A failure recording ownership
 * removes the new lock. Abrupt termination can leave a stale lock that needs manual investigation.
 */
export function acquireSuiteLock(): void {
  const inheritedToken = process.env[tokenKey];
  if (inheritedToken) {
    try {
      const owner = JSON.parse(readFileSync(ownerFile, 'utf8')) as { token?: unknown };
      if (owner.token === inheritedToken) return;
    } catch {
      // Missing or malformed ownership cannot grant access to an existing lock.
    }
  }

  mkdirSync(new URL('../', lock), { recursive: true });
  try {
    mkdirSync(lock);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error(
        'An E2E suite already owns .direnv/e2e-suite.lock. Check its owner before removing a stale lock.',
        { cause: error },
      );
    }
    throw error;
  }

  const token = randomUUID();
  try {
    writeFileSync(ownerFile, JSON.stringify({ pid: process.pid, token }) + '\n');
  } catch (error) {
    rmSync(lock, { recursive: true });
    throw error;
  }
  process.env[tokenKey] = token;
  process.once('exit', () => rmSync(lock, { recursive: true, force: true }));
}
