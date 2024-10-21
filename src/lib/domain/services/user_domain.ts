import type { UserDomain, UserDomainRepository } from '$lib/domain/entities/user_domain';
import { generateIdFromEntropySize } from 'lucia';

export class UserDomainService {
  constructor(private userDomain: UserDomainRepository) {}

  async createUserDomain(userId: string, domain: string): Promise<UserDomain> {
    const generated = generateIdFromEntropySize(20); // 32 characters long
    const verifyTxtRecord = `exodus-site-verification=${generated}`;
    const values = { userId, domain, verifyTxtRecord };
    const ud = await this.userDomain.create(values);
    return ud;
  }

  async listUserDomains(userId: string): Promise<UserDomain[]> {
    return await this.userDomain.listByUserId(userId);
  }

  async getUserDomain(userId: string, domain: string): Promise<UserDomain> {
    return await this.userDomain.getUserDomain(userId, domain);
  }

  async deleteUserDomain(userId: string, domain: string): Promise<void> {
    await this.userDomain.delete(userId, domain);
  }
}
