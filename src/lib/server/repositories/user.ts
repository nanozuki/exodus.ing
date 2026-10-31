import type { User } from '#lib/models/user.js';
import { asc, eq } from 'drizzle-orm';
import { tUser, type AppDatabase, type UserRow } from '#lib/server/db/schema.js';
import { newNanoId, newVerifyCode, wrap } from './utils';

function model(row: UserRow): User {
  const { id, username, githubId, name, aboutMe, verifyCode } = row;
  return { id, username, githubId, name, aboutMe, verifyCode };
}

// Exactly 16-character legacy IDs are looked up using their first six characters.
export async function findUserById(db: AppDatabase, id: string): Promise<User | null> {
  return wrap('findUserById', async () => {
    const [row] = await db
      .select()
      .from(tUser)
      .where(eq(tUser.id, id.length === 16 ? id.slice(0, 6) : id));
    return row ? model(row) : null;
  });
}

export async function findUserByUsername(db: AppDatabase, username: string): Promise<User | null> {
  return wrap('findUserByUsername', async () => {
    const [row] = await db.select().from(tUser).where(eq(tUser.username, username));
    return row ? model(row) : null;
  });
}

export async function findUserByName(db: AppDatabase, name: string): Promise<User | null> {
  return wrap('findUserByName', async () => {
    const [row] = await db.select().from(tUser).where(eq(tUser.name, name));
    return row ? model(row) : null;
  });
}

export async function findUserByGitHubId(db: AppDatabase, githubId: number): Promise<User | null> {
  return wrap('findUserByGitHubId', async () => {
    const [row] = await db.select().from(tUser).where(eq(tUser.githubId, githubId));
    return row ? model(row) : null;
  });
}

export async function getUsers(db: AppDatabase): Promise<User[]> {
  return wrap('getUsers', async () => (await db.select().from(tUser).orderBy(asc(tUser.id))).map(model));
}

export interface CreateUserParams {
  username: string;
  githubId: number | null;
  name: string;
  aboutMe: string;
}

export async function createUser(db: AppDatabase, params: CreateUserParams): Promise<User> {
  return wrap('createUser', async () => {
    let id = newNanoId();
    while (await db.$count(tUser, eq(tUser.id, id))) id = newNanoId();
    const now = new Date();
    const [row] = await db
      .insert(tUser)
      .values({ ...params, id, verifyCode: newVerifyCode(), createdAt: now, updatedAt: now })
      .returning();
    return model(row);
  });
}

export interface UpdateUserParams {
  id: string;
  username?: string;
  name?: string;
  aboutMe?: string;
}

// This operation leaves updatedAt unchanged.
export async function updateUser(db: AppDatabase, { id, ...patch }: UpdateUserParams): Promise<void> {
  return wrap('updateUser', async () => {
    await db.update(tUser).set(patch).where(eq(tUser.id, id));
  });
}
