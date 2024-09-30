import { AppError } from '$lib/errors';
import { customAlphabet } from 'nanoid';

export async function wrap<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      return AppError.DatabaseError(error.message).throw();
    } else {
      return AppError.DatabaseError(JSON.stringify(error)).throw();
    }
  }
}

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 6);

export function newNanoId(): string {
  return nanoid();
}
