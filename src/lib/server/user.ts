import * as schema from '$lib/schema';
import { eq } from 'drizzle-orm';
import type { GitHubUser } from './auth';
import { generateUserId } from './id';
import type { User } from '$lib/entities';

function parseUser(user: schema.User): User {
  return {
    id: user.id,
    githubId: user.githubId,
    username: user.username,
    name: user.name || user.username,
    aboutMe: user.aboutMe,
  };
}

export async function getUserByGitHubId(locals: App.Locals, id: number): Promise<User | null> {
  const users = await locals.db.select().from(schema.user).where(eq(schema.user.githubId, id));
  return users.length !== 0 ? parseUser(users[0]) : null;
}

export async function getUserById(locals: App.Locals, userId: string): Promise<User | null> {
  // if userId's length is 16, it's legacy userId, shorten it by first 6 characters
  if (userId.length === 16) {
    userId = userId.slice(0, 6);
  }
  const users = await locals.db.select().from(schema.user).where(eq(schema.user.id, userId));
  return users.length !== 0 ? parseUser(users[0]) : null;
}

export async function getUserByUsername(
  locals: App.Locals,
  username: string,
): Promise<User | null> {
  const users = await locals.db
    .select()
    .from(schema.user)
    .where(eq(schema.user.username, username));
  return users.length !== 0 ? parseUser(users[0]) : null;
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
  await locals.db.insert(schema.user).values(user);
  return parseUser(user);
}

export async function updateUsername(
  locals: App.Locals,
  userId: string,
  username: string,
): Promise<void> {
  await locals.db.update(schema.user).set({ username }).where(eq(schema.user.id, userId));
}

export async function updateProfile(
  locals: App.Locals,
  userId: string,
  name: string,
  aboutMe: string,
): Promise<void> {
  await locals.db.update(schema.user).set({ name, aboutMe }).where(eq(schema.user.id, userId));
}
