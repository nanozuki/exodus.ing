import { getTxtRecords } from '$lib/dns';
import type { UserDomain } from '$lib/entities';
import { tUserDomain } from '$lib/schema';
import { and, eq } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';

export async function createUserDomain(
  locals: App.Locals,
  userId: string,
  domain: string,
): Promise<UserDomain> {
  const generated = generateIdFromEntropySize(20); // 32 characters long
  const verifyTxtRecord = `exodus-site-verification=${generated}`;
  const values = { userId, domain, verifyTxtRecord };
  const userDomain = await locals.db.insert(tUserDomain).values(values).returning();
  if (userDomain.length === 0) {
    throw new Error('Failed to create user domain'); // TODO: improve error message
  }
  return userDomain[0];
}

export async function verifyUserDomain(
  locals: App.Locals,
  userId: string,
  domain: string,
): Promise<boolean> {
  const userDomain = await locals.db
    .select()
    .from(tUserDomain)
    .where(and(eq(tUserDomain.userId, userId), eq(tUserDomain.domain, domain)));
  if (userDomain.length === 0) {
    throw new Error('User domain not found'); // TODO: improve error message
  }
  const records = await getTxtRecords(domain);
  let verified = false;
  for (const record of records) {
    if (record === userDomain[0].verifyTxtRecord) {
      verified = true;
      break;
    }
  }
  if (verified) {
    await locals.db
      .update(tUserDomain)
      .set({ verifiedAt: new Date() })
      .where(eq(tUserDomain.id, userDomain[0].id));
  }
  return verified;
}

export async function getUserDomains(locals: App.Locals, userId: string): Promise<UserDomain[]> {
  return locals.db.select().from(tUserDomain).where(eq(tUserDomain.userId, userId));
}

export async function deleteUserDomain(
  locals: App.Locals,
  userId: string,
  domain: string,
): Promise<void> {
  await locals.db
    .delete(tUserDomain)
    .where(and(eq(tUserDomain.userId, userId), eq(tUserDomain.domain, domain)));
}
