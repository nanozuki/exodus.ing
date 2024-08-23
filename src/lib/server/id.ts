import { customAlphabet } from 'nanoid';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/schema';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 6);

export async function generateUserId(locals: App.Locals) {
  let id = nanoid();
  let user = await locals.db.select().from(schema.user).where(eq(schema.user.id, id));
  while (user.length > 0) {
    // try again if the id is already in use
    id = nanoid();
    user = await locals.db.select().from(schema.user).where(eq(schema.user.id, id));
  }
  return id;
}

export async function generateArticleId(locals: App.Locals) {
  let id = nanoid();
  let article = await locals.db.select().from(schema.article).where(eq(schema.article.id, id));
  while (article.length > 0) {
    // try again if the id is already in use
    id = nanoid();
    article = await locals.db.select().from(schema.article).where(eq(schema.article.id, id));
  }
  return id;
}
