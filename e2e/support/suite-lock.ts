import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const lock = new URL('../../.direnv/e2e-suite.lock/', import.meta.url);
const ownerFile = new URL('owner', lock);
const tokenKey = 'EXODUS_E2E_LOCK_TOKEN';

/**
 * Acquire the checkout lock before Playwright clears output. Discovery subprocesses and workers
 * inherit the owner's token; only the owning CLI process releases the lock when it exits.
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
