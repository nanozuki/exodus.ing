import { eq } from 'drizzle-orm';
import type { GitHubUser } from './auth';
import { generateUserId } from './id';
import type { User } from '$lib/entities';
import { tUser } from '$lib/schema';

export async function getUserByGitHubId(locals: App.Locals, id: number): Promise<User | null> {
  const users = await locals.db.select().from(tUser).where(eq(tUser.githubId, id));
  return users.length !== 0 ? users[0] : null;
}

export async function getUserById(locals: App.Locals, userId: string): Promise<User | null> {
  // if userId's length is 16, it's legacy userId, shorten it by first 6 characters
  if (userId.length === 16) {
    userId = userId.slice(0, 6);
  }
  const users = await locals.db.select().from(tUser).where(eq(tUser.id, userId));
  return users.length !== 0 ? users[0] : null;
}

export async function getUserByUsername(
  locals: App.Locals,
  username: string,
): Promise<User | null> {
  const users = await locals.db.select().from(tUser).where(eq(tUser.username, username));
  return users.length !== 0 ? users[0] : null;
}

export async function createUserByGitHub(locals: App.Locals, gu: GitHubUser): Promise<User> {
  const userId = await generateUserId(locals);
  const now = new Date();
  const user = {
    id: userId,
    createdAt: now,
    updatedAt: now,
    username: gu.login,
    githubId: gu.id,
    name: gu.login,
    aboutMe: '',
  };
  await locals.db.insert(tUser).values(user);
  return user;
}

export async function updateUsername(
  locals: App.Locals,
  userId: string,
  username: string,
): Promise<void> {
  await locals.db.update(tUser).set({ username }).where(eq(tUser.id, userId));
}

export async function updateProfile(
  locals: App.Locals,
  userId: string,
  name: string,
  aboutMe: string,
): Promise<void> {
  await locals.db.update(tUser).set({ name, aboutMe }).where(eq(tUser.id, userId));
}
