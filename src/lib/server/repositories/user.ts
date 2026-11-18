import type { IdentityProvider, User, UserIdentity } from '#lib/models/user.js';
import { and, asc, eq } from 'drizzle-orm';
import { tUser, tUserIdentity, type AppDatabase, type UserRow } from '#lib/server/db/schema.js';
import { newNanoId, newVerifyCode, wrap } from './utils';

function model(row: UserRow): User {
  const { id, username, name, aboutMe, verifyCode } = row;
  return { id, username, name, aboutMe, verifyCode };
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

export async function findUserByIdentity(
  db: AppDatabase,
  identity: { provider: IdentityProvider; subject: string },
): Promise<User | null> {
  return wrap('findUserByIdentity', async () => {
    const [row] = await db
      .select({ user: tUser })
      .from(tUserIdentity)
      .innerJoin(tUser, eq(tUser.id, tUserIdentity.userId))
      .where(and(eq(tUserIdentity.provider, identity.provider), eq(tUserIdentity.subject, identity.subject)));
    return row ? model(row.user) : null;
  });
}

// Ordered by creation time ascending.
export async function getIdentitiesOfUser(db: AppDatabase, userId: string): Promise<UserIdentity[]> {
  return wrap('getIdentitiesOfUser', () =>
    db
      .select({
        userId: tUserIdentity.userId,
        provider: tUserIdentity.provider,
        subject: tUserIdentity.subject,
      })
      .from(tUserIdentity)
      .where(eq(tUserIdentity.userId, userId))
      .orderBy(asc(tUserIdentity.createdAt), asc(tUserIdentity.provider), asc(tUserIdentity.subject)),
  );
}

export async function getUsers(db: AppDatabase): Promise<User[]> {
  return wrap('getUsers', async () => (await db.select().from(tUser).orderBy(asc(tUser.id))).map(model));
}

export interface CreateUserParams {
  username: string;
  name: string;
  aboutMe: string;
  identity: { provider: IdentityProvider; subject: string };
}

// The user and its identity are created atomically; an identity already linked to another user rejects both.
export async function createUser(db: AppDatabase, { identity, ...profile }: CreateUserParams): Promise<User> {
  return wrap('createUser', () =>
    db.transaction(async (tx) => {
      let id = newNanoId();
      while (await tx.$count(tUser, eq(tUser.id, id))) id = newNanoId();
      const now = new Date();
      const [row] = await tx
        .insert(tUser)
        .values({ ...profile, id, verifyCode: newVerifyCode(), createdAt: now, updatedAt: now })
        .returning();
      await tx.insert(tUserIdentity).values({ ...identity, userId: id, createdAt: now });
      return model(row);
    }),
  );
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
