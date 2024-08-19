import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 6);

export async function generateUserId(locals: App.Locals) {
  let id = nanoid();
  let user = await locals.db.query.user.findFirst({ with: { id } });
  while (user) {
    // try again if the id is already in use
    id = nanoid();
    user = await locals.db.query.user.findFirst({ with: { id } });
  }
  return id;
}

export async function generateArticleId(locals: App.Locals) {
  let id = nanoid();
  let article = await locals.db.query.article.findFirst({ with: { id } });
  while (article) {
    // try again if the id is already in use
    id = nanoid();
    article = await locals.db.query.article.findFirst({ with: { id } });
  }
  return id;
}
