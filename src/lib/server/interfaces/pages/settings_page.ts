import type { UserDomain } from '$lib/domain/entities/user_domain';
import type { UserService } from '$lib/domain/services/user';
import type { UserDomainService } from '$lib/domain/services/user_domain';
import type { NameResolverService } from '$lib/domain/services/name_resolver';

export class SettingsPage {
  constructor(
    private readonly user: UserService,
    private readonly domain: UserDomainService,
    private readonly nameResolver: NameResolverService,
  ) {}

  async updateUsername(userId: string, username: string): Promise<void> {
    return this.user.updateUsername(userId, username);
  }

  async updateProfile(userId: string, name: string, aboutMe: string): Promise<void> {
    return this.user.updateProfile(userId, name, aboutMe);
  }

  async listUserDomains(userId: string): Promise<UserDomain[]> {
    const domains = await this.domain.listUserDomains(userId);
    await Promise.all(domains.map((domain) => this.nameResolver.verify(domain)));
    return domains;
  }

  async getUserDomain(userId: string, domain: string): Promise<UserDomain> {
    const domainObj = await this.domain.getUserDomain(userId, domain);
    await this.nameResolver.verify(domainObj);
    return domainObj;
  }

  async addUserDomain(userId: string, domain: string): Promise<UserDomain> {
    return this.domain.createUserDomain(userId, domain);
  }

  async deleteUserDomain(userId: string, domain: string): Promise<void> {
    return this.domain.deleteUserDomain(userId, domain);
  }
}
