// user.ts reads users, their sign-in identities, and profile data, and persists new users and supplied profile changes.

import type { IdentityProvider, User, UserIdentity } from '#lib/models/user.js';
import { and, asc, eq, getTableColumns } from 'drizzle-orm';
import { tUser, tUserIdentity, type AppDatabase, type UserRow } from '#lib/server/db/schema.js';
import { newNanoId, newVerifyCode, wrap } from './utils';

function model(row: UserRow): User {
  const { id, username, name, aboutMe, verifyCode } = row;
  return { id, username, name, aboutMe, verifyCode };
}

/** Looks up a 16-character legacy ID by its first six characters; other IDs are used as given. */
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

/** Returns the user that owns the identity `subject` at `provider`. */
export async function findUserByIdentity(
  db: AppDatabase,
  identity: { provider: IdentityProvider; subject: string },
): Promise<User | null> {
  return wrap('findUserByIdentity', async () => {
    const [row] = await db
      .select(getTableColumns(tUser))
      .from(tUserIdentity)
      .innerJoin(tUser, eq(tUser.id, tUserIdentity.userId))
      .where(and(eq(tUserIdentity.provider, identity.provider), eq(tUserIdentity.subject, identity.subject)));
    return row ? model(row) : null;
  });
}

/** Returns every sign-in identity of the user, oldest first; `[]` also for an unknown user. */
export async function getIdentitiesOfUser(db: AppDatabase, userId: string): Promise<UserIdentity[]> {
  return wrap('getIdentitiesOfUser', async () =>
    db
      .select({ provider: tUserIdentity.provider, subject: tUserIdentity.subject, userId: tUserIdentity.userId })
      .from(tUserIdentity)
      .where(eq(tUserIdentity.userId, userId))
      .orderBy(asc(tUserIdentity.createdAt)),
  );
}

/** Returns every user ordered by ID, without truncation. */
export async function getUsers(db: AppDatabase): Promise<User[]> {
  return wrap('getUsers', async () => (await db.select().from(tUser).orderBy(asc(tUser.id))).map(model));
}

/** `identity` is the sign-in method the new user signs up with. */
export interface CreateUserParams {
  username: string;
  name: string;
  aboutMe: string;
  identity: { provider: IdentityProvider; subject: string };
}

/**
 * Creates a user with a generated unique six-character ID, a 32-character verification code, and the current time as
 * both timestamps, together with its identity, in one transaction. A taken username or name throws PARAMETER_INVALID
 * on `username` or `name`; an identity that already belongs to a user throws DATABASE_ERROR. Either failure writes
 * nothing.
 */
export async function createUser(db: AppDatabase, { identity, ...profile }: CreateUserParams): Promise<User> {
  return wrap('createUser', async () =>
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

/** Omitted fields stay unchanged; the verification code cannot change through `updateUser`. */
export interface UpdateUserParams {
  id: string;
  username?: string;
  name?: string;
  aboutMe?: string;
}

/**
 * Updates the supplied fields by ID without checking existence, and leaves `updatedAt` unchanged. A taken username or
 * name throws PARAMETER_INVALID on `username` or `name`. Username rules and authorization belong to callers.
 */
export async function updateUser(db: AppDatabase, { id, ...patch }: UpdateUserParams): Promise<void> {
  return wrap('updateUser', async () => {
    await db.update(tUser).set(patch).where(eq(tUser.id, id));
  });
}
