import * as schema from '$lib/schema';
import { eq } from 'drizzle-orm';
import type { GitHubUser } from './auth';
import { generateUserId } from './id';

export async function getUserByGitHubId(
  locals: App.Locals,
  id: number,
): Promise<schema.User | null> {
  const users = await locals.db.select().from(schema.user).where(eq(schema.user.githubId, id));
  if (users.length === 0) {
    return null;
  }
  return users[0];
}

export async function getUserById(locals: App.Locals, userId: string): Promise<schema.User | null> {
  // if userId's length is 16, it's legacy userId, shorten it by first 6 characters
  if (userId.length === 16) {
    userId = userId.slice(0, 6);
  }
  const users = await locals.db.select().from(schema.user).where(eq(schema.user.id, userId));
  if (users.length === 0) {
    return null;
  }
  return users[0];
}

export async function createUserByGitHub(locals: App.Locals, gu: GitHubUser): Promise<schema.User> {
  const userId = await generateUserId(locals);
  const now = new Date();
  const user = {
    id: userId,
    createdAt: now,
    updatedAt: now,
    username: gu.login,
    githubId: gu.id,
  };
  await locals.db.insert(schema.user).values(user);
  return user;
}

export async function updateUsername(
  locals: App.Locals,
  userId: string,
  username: string,
): Promise<void> {
  await locals.db.update(schema.user).set({ username }).where(eq(schema.user.id, userId));
}
