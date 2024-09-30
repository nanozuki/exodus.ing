import type {
  UserDomain,
  UserDomainInput,
  UserDomainPatch,
  UserDomainRepository,
} from '$lib/domain/user_domain';
import { and, eq } from 'drizzle-orm/sql';
import { tUserDomain, type AppD1Database } from './schema';
import { wrap } from './utils';
import { AppError } from '$lib/errors';

export class D1UserDomainRepository implements UserDomainRepository {
  constructor(private db: AppD1Database) {}

  async listByUserId(userId: string): Promise<UserDomain[]> {
    const userDomains = await wrap(
      async () =>
        await this.db
          .select()
          .from(tUserDomain)
          .where(eq(tUserDomain.userId, userId))
          .orderBy(tUserDomain.domain),
    );
    return userDomains;
  }

  async findUserDomain(userId: string, domain: string): Promise<UserDomain | null> {
    const userDomains = await wrap(
      async () =>
        await this.db
          .select()
          .from(tUserDomain)
          .where(and(eq(tUserDomain.userId, userId), eq(tUserDomain.domain, domain))),
    );
    return userDomains.length === 0 ? null : userDomains[0];
  }

  async create(input: UserDomainInput): Promise<UserDomain> {
    const domains = await wrap(
      async () => await this.db.insert(tUserDomain).values(input).returning(),
    );
    if (domains.length === 0) {
      return AppError.DatabaseError('Failed to create user domain').throw();
    }
    return domains[0];
  }

  async update(
    userId: string,
    domain: string,
    patch: Partial<UserDomainPatch>,
  ): Promise<UserDomain> {
    await wrap(
      async () =>
        await this.db
          .update(tUserDomain)
          .set(patch)
          .where(and(eq(tUserDomain.userId, userId), eq(tUserDomain.domain, domain))),
    );
    const ud = await this.findUserDomain(userId, domain);
    if (!ud) {
      return AppError.UserDomainNotFound(domain).throw();
    }
    return ud;
  }

  async delete(userId: string, domain: string): Promise<void> {
    await wrap(
      async () =>
        await this.db
          .delete(tUserDomain)
          .where(and(eq(tUserDomain.userId, userId), eq(tUserDomain.domain, domain))),
    );
  }
}
