import type {
  UserDomain,
  UserDomainInput,
  UserDomainPatch,
  UserDomainRepository,
} from '$lib/domain/entities/user_domain';
import { AppError } from '$lib/errors';
import { and, eq } from 'drizzle-orm/sql';
import { tUserDomain, type AppD1Database } from './schema';
import { wrap } from './utils';

export class D1UserDomainRepository implements UserDomainRepository {
  constructor(private db: AppD1Database) {}

  async listByUserId(userId: string): Promise<UserDomain[]> {
    return await wrap('userDomain.listByUserId', async () => {
      const userDomains = await this.db
        .select()
        .from(tUserDomain)
        .where(eq(tUserDomain.userId, userId))
        .orderBy(tUserDomain.domain);
      return userDomains;
    });
  }

  async getUserDomain(userId: string, domain: string): Promise<UserDomain> {
    return await wrap('userDomain.getUserDomain', async () => {
      const userDomains = await this.db
        .select()
        .from(tUserDomain)
        .where(and(eq(tUserDomain.userId, userId), eq(tUserDomain.domain, domain)));
      if (userDomains.length === 0) {
        return AppError.UserDomainNotFound(domain).throw();
      }
      return userDomains[0];
    });
  }

  async create(input: UserDomainInput): Promise<UserDomain> {
    return await wrap('userDomain.create', async () => {
      const domains = await this.db.insert(tUserDomain).values(input).returning();
      if (domains.length === 0) {
        return AppError.DatabaseError('Failed to create user domain').throw();
      }
      return domains[0];
    });
  }

  async update(userId: string, domain: string, patch: Partial<UserDomainPatch>): Promise<UserDomain> {
    return await wrap('userDomain.update', async () => {
      const domains = await this.db
        .update(tUserDomain)
        .set(patch)
        .where(and(eq(tUserDomain.userId, userId), eq(tUserDomain.domain, domain)))
        .returning();
      if (domains.length === 0) {
        return AppError.UserDomainNotFound(domain).throw();
      }
      return domains[0];
    });
  }

  async delete(userId: string, domain: string): Promise<void> {
    await wrap('userDomain.delete', () =>
      this.db.delete(tUserDomain).where(and(eq(tUserDomain.userId, userId), eq(tUserDomain.domain, domain))),
    );
  }
}
