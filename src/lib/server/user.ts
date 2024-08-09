import * as schema from '$lib/schema';
import { eq } from 'drizzle-orm';
import type { GitHubUser } from './auth';
import { generateIdFromEntropySize } from 'lucia';

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
  const users = await locals.db.select().from(schema.user).where(eq(schema.user.id, userId));
  if (users.length === 0) {
    return null;
  }
  return users[0];
}

export async function createUserByGitHub(locals: App.Locals, gu: GitHubUser): Promise<schema.User> {
  const userId = generateIdFromEntropySize(10); // 16 characters long
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
