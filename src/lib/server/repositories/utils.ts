// utils.ts holds the operation wrapping and storage identifier generation shared by the repositories in this
// directory. These helpers are not database operations themselves.

import { throwError } from '#lib/errors.js';
import { isHttpError } from '@sveltejs/kit';
import { customAlphabet } from 'nanoid';

const userConflicts = {
  user_username_unique: { username: '用户名已存在' },
  user_name_unique: { name: '昵称已存在' },
};

const fieldConflicts: Record<string, Record<string, Record<string, string>>> = {
  createUser: userConflicts,
  updateUser: userConflicts,
  createArticle: { article_title_idx: { title: '你已经发布过同名文章' } },
  updateArticle: { article_title_idx: { title: '你已经发布过同名文章' } },
};

/**
 * Runs a repository operation, logging its duration on success. Pass the exported operation's name, which keys the
 * conflict mapping: a PostgreSQL unique violation on a known constraint becomes PARAMETER_INVALID on the field
 * (`createUser` and `updateUser`: `username`, `name`; `createArticle` and `updateArticle`: `title`). HTTP errors
 * propagate unchanged; other errors become DATABASE_ERROR with the operation name and the error message, or the
 * JSON-serialized value for non-Error throws. A value that cannot be serialized propagates the serialization failure.
 */
export async function wrap<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  try {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`[DATABASE-METHOD] ${operation} executed in ${duration}ms`);
    return result;
  } catch (e) {
    // Drizzle wraps the PostgreSQL error in cause; match structured constraints,
    // never SQL text, so unrelated failures retain their error-page behavior.
    for (let cause: unknown = e; cause instanceof Error; cause = cause.cause) {
      if ('code' in cause && cause.code === '23505' && 'constraint' in cause && typeof cause.constraint === 'string') {
        const fields = fieldConflicts[operation]?.[cause.constraint];
        if (fields) return throwError('PARAMETER_INVALID', fields);
      }
    }
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

/**
 * Generates six lowercase alphanumeric characters, the length legacy ID lookups depend on. The inserting operation
 * checks uniqueness.
 */
export function newNanoId(): string {
  return nanoid();
}

/** Generates 16 lowercase alphanumeric characters for an invitation code. */
export function newCode(): string {
  return code();
}

/** Generates 32 lowercase alphanumeric characters for a user's verification code. */
export function newVerifyCode(): string {
  return verifyCode();
}
