import type { UserDomain, UserDomainRepository } from '$lib/domain/entities/user_domain';
import { generateIdFromEntropySize } from 'lucia';

export interface NameResolver {
  resolveTxt(domain: string): Promise<string[]>;
}

export class UserDomainService {
  constructor(
    private userDomain: UserDomainRepository,
    private nameResolver: NameResolver,
  ) {}

  private async verify(domain: UserDomain): Promise<boolean> {
    if (domain.verifiedAt) {
      return true;
    }
    const records = await this.nameResolver.resolveTxt(domain.domain);
    return records.some((record) => record.includes(domain.verifyTxtRecord));
  }

  async createUserDomain(userId: string, domain: string): Promise<UserDomain> {
    const generated = generateIdFromEntropySize(20); // 32 characters long
    const verifyTxtRecord = `exodus-site-verification=${generated}`;
    const values = { userId, domain, verifyTxtRecord };
    const ud = await this.userDomain.create(values);
    return ud;
  }

  async listUserDomains(userId: string): Promise<UserDomain[]> {
    const domains = await this.userDomain.listByUserId(userId);
    await Promise.all(domains.map((domain) => this.verify(domain)));
    return domains;
  }

  async getUserDomain(userId: string, domain: string): Promise<UserDomain> {
    const domainObj = await this.userDomain.getUserDomain(userId, domain);
    await this.verify(domainObj);
    return domainObj;
  }

  async deleteUserDomain(userId: string, domain: string): Promise<void> {
    await this.userDomain.delete(userId, domain);
  }
}
