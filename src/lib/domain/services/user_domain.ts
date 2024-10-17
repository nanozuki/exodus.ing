import type { UserDomain, UserDomainRepository } from '$lib/domain/entities/user_domain';
import { generateIdFromEntropySize } from 'lucia';
import type { NameResolver } from '../ports';

export class UserDomainService {
  constructor(
    private userDomain: UserDomainRepository,
    private nameResolver: NameResolver,
  ) {} // TODO: split this service

  async createUserDomain(userId: string, domain: string): Promise<UserDomain> {
    const generated = generateIdFromEntropySize(20); // 32 characters long
    const verifyTxtRecord = `exodus-site-verification=${generated}`;
    const values = { userId, domain, verifyTxtRecord };
    const ud = await this.userDomain.create(values);
    return ud;
  }

  async getUserDomains(userId: string): Promise<UserDomain[]> {
    return await this.userDomain.listByUserId(userId);
  }

  private async verifyDomain(domain: string, txtRecord: string): Promise<boolean> {
    const records = await this.nameResolver.resolveTxt(domain);
    for (const record of records) {
      if (record.includes(txtRecord)) {
        return true;
      }
    }
    return false;
  }

  async getUserDomain(userId: string, domain: string): Promise<UserDomain> {
    const userDomain = await this.userDomain.getUserDomain(userId, domain);
    if (!userDomain.verifiedAt) {
      const verified = await this.verifyDomain(domain, userDomain.verifyTxtRecord);
      if (verified) {
        userDomain.verifiedAt = new Date();
        await this.userDomain.update(userId, domain, { verifiedAt: userDomain.verifiedAt });
      }
    }
    return userDomain;
  }

  async deleteUserDomain(userId: string, domain: string): Promise<void> {
    await this.userDomain.delete(userId, domain);
  }
}
