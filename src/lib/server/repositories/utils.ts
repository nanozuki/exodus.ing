import { throwError } from '#lib/errors.js';
import { isHttpError } from '@sveltejs/kit';
import { customAlphabet } from 'nanoid';

const fieldConflicts: Record<string, Record<string, Record<string, string>>> = {
  updateUser: {
    user_username_unique: { username: '用户名已存在' },
    user_name_unique: { name: '昵称已存在' },
  },
  createArticle: { article_title_idx: { title: '你已经发布过同名文章' } },
  updateArticle: { article_title_idx: { title: '你已经发布过同名文章' } },
};

// Use the exported operation name. Known write conflicts become field errors;
// HTTP errors survive and unexpected failures become DATABASE_ERROR.
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
