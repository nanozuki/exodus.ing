import { throwError } from '$lib/errors';
import { isHttpError } from '@sveltejs/kit';
import { customAlphabet } from 'nanoid';

// Use the exported operation name as the label. HTTP errors survive; unexpected failures become DATABASE_ERROR.
export async function wrap<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  try {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`[DATABASE-METHOD] ${operation} executed in ${duration}ms`);
    return result;
  } catch (e) {
    if (isHttpError(e)) {
      throw e;
    } else if (e instanceof Error) {
      return throwError('DATABASE_ERROR', { operation, cause: e.message });
    } else {
      const cause = JSON.stringify(e);
      return throwError('DATABASE_ERROR', { operation, cause });
    }
  }
}

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 6);
const code = customAlphabet(alphabet, 16);
const verifyCode = customAlphabet(alphabet, 32);

// Six-character IDs preserve compatibility with legacy ID lookups.
export function newNanoId(): string {
  return nanoid();
}

export function newCode(): string {
  return code();
}

export function newVerifyCode(): string {
  return verifyCode();
}
