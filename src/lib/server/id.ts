import { tArticle, tUser } from '$lib/schema';
import { eq } from 'drizzle-orm';
import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 6);

export async function generateUserId(locals: App.Locals) {
  let id = nanoid();
  let user = await locals.db.select().from(tUser).where(eq(tUser.id, id));
  while (user.length > 0) {
    // try again if the id is already in use
    id = nanoid();
    user = await locals.db.select().from(tUser).where(eq(tUser.id, id));
  }
  return id;
}

export async function generateArticleId(locals: App.Locals) {
  let id = nanoid();
  let article = await locals.db.select().from(tArticle).where(eq(tArticle.id, id));
  while (article.length > 0) {
    // try again if the id is already in use
    id = nanoid();
    article = await locals.db.select().from(tArticle).where(eq(tArticle.id, id));
  }
  return id;
}
