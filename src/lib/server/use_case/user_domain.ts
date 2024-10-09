import type { UserDomain } from '$lib/domain/user_domain';
import { generateIdFromEntropySize } from 'lucia';
import type { Context } from '$lib/server/context';

export class UserDomainUseCase {
  constructor(private ctx: Context) {}

  async createUserDomain(userId: string, domain: string): Promise<UserDomain> {
    const generated = generateIdFromEntropySize(20); // 32 characters long
    const verifyTxtRecord = `exodus-site-verification=${generated}`;
    const values = { userId, domain, verifyTxtRecord };
    const ud = await this.ctx.userDomain.create(values);
    return ud;
  }

  async getUserDomains(userId: string): Promise<UserDomain[]> {
    return await this.ctx.userDomain.listByUserId(userId);
  }

  private async verifyDomain(domain: string, txtRecord: string): Promise<boolean> {
    const records = await this.ctx.nameResolver.resolveTxt(domain);
    for (const record of records) {
      if (record.includes(txtRecord)) {
        return true;
      }
    }
    return false;
  }

  async getUserDomain(userId: string, domain: string): Promise<UserDomain> {
    const userDomain = await this.ctx.userDomain.getUserDomain(userId, domain);
    if (!userDomain.verifiedAt) {
      const verified = await this.verifyDomain(domain, userDomain.verifyTxtRecord);
      if (verified) {
        userDomain.verifiedAt = this.ctx.clock.now();
        await this.ctx.userDomain.update(userId, domain, { verifiedAt: userDomain.verifiedAt });
      }
    }
    return userDomain;
  }

  async deleteUserDomain(userId: string, domain: string): Promise<void> {
    await this.ctx.userDomain.delete(userId, domain);
  }
}
