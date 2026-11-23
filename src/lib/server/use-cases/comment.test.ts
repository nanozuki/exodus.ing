import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, type TestDatabase } from '#lib/server/testing/database.js';
import { Role } from '#lib/models/role.js';
import type { LoggedInUser } from '#lib/models/user.js';
import { findUserByUsername } from '#lib/server/repositories/user.js';
import { saveComment } from './comment';

let database: TestDatabase;
let author: LoggedInUser;
let reader: LoggedInUser;

beforeAll(async () => {
  database = await createTestDatabase('use-case-comment');
  author = { ...(await findUserByUsername(database.db, 'alice'))!, roles: [Role.ArticleAuthor] };
  reader = { ...(await findUserByUsername(database.db, 'carol'))!, roles: [] };
}, 120_000);

afterAll(async () => {
  await database?.close();
}, 120_000);

describe('saveComment', () => {
  it('keeps an edited comment on its stored article over a submitted articleId', async () => {
    const deps = { db: database.db };
    const created = await saveComment(deps, { actor: reader, articleId: 'A21', content: 'original' });
    expect(
      await saveComment(deps, { actor: reader, articleId: 'A01', commentId: created.commentId, content: 'edited' }),
    ).toEqual(created);
  });

  it("throws BAD_REQUEST when editing another author's comment", async () => {
    const deps = { db: database.db };
    const created = await saveComment(deps, { actor: reader, articleId: 'A21', content: 'not yours' });
    await expect(
      saveComment(deps, { actor: author, commentId: created.commentId, content: 'stolen' }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('throws BAD_REQUEST when creating a comment without articleId', async () => {
    await expect(saveComment({ db: database.db }, { actor: reader, content: 'no article' })).rejects.toMatchObject({
      status: 400,
    });
  });
});
