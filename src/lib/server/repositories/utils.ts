import { AppError } from '$lib/errors';
import { customAlphabet } from 'nanoid';

export async function wrap<T>(method: string, fn: () => Promise<T>): Promise<T> {
  try {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`[DATABASE-METHOD] ${method} executed in ${duration}ms`);
    return result;
  } catch (error) {
    if (error instanceof AppError) {
      return error.throw();
    } else if (error instanceof Error) {
      return AppError.DatabaseError(`${method} failed: ${error.message}`).throw();
    } else {
      return AppError.DatabaseError(`${method} failed: ${JSON.stringify(error)}`).throw();
    }
  }
}

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 6);
const code = customAlphabet(alphabet, 16);

export function newNanoId(): string {
  return nanoid();
}

export function newCode(): string {
  return code();
}
