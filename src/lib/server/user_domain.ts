import { getTxtRecords } from '$lib/dns';
import type { UserDomain } from '$lib/entities';
import { tUserDomain } from '$lib/schema';
import { and, eq, isNotNull } from 'drizzle-orm';
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

export async function getUserDomains(locals: App.Locals, userId: string): Promise<UserDomain[]> {
  return locals.db.select().from(tUserDomain).where(eq(tUserDomain.userId, userId));
}

async function verifyDomain(domain: string, txtRecord: string): Promise<boolean> {
  const records = await getTxtRecords(domain);
  for (const record of records) {
    if (record.includes(txtRecord)) {
      return true;
    }
  }
  return false;
}

export async function getUserDomain(
  locals: App.Locals,
  userId: string,
  domain: string,
): Promise<UserDomain | null> {
  const userDomains = await locals.db
    .select()
    .from(tUserDomain)
    .where(and(eq(tUserDomain.userId, userId), eq(tUserDomain.domain, domain)));
  const userDomain = userDomains.length === 0 ? null : userDomains[0];
  if (userDomain && !userDomain.verifiedAt) {
    const verified = await verifyDomain(domain, userDomain.verifyTxtRecord);
    if (verified) {
      userDomain.verifiedAt = new Date();
      await locals.db
        .update(tUserDomain)
        .set({ verifiedAt: new Date() })
        .where(eq(tUserDomain.id, userDomain.id));
    }
  }
  return userDomain;
}

export async function getUserVerifiedDomains(
  locals: App.Locals,
  userId: string,
): Promise<UserDomain[]> {
  return locals.db
    .select()
    .from(tUserDomain)
    .where(and(eq(tUserDomain.userId, userId), isNotNull(tUserDomain.verifiedAt)));
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
