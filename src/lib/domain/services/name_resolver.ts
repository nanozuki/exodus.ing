import type { UserDomain } from '$lib/domain/entities/user_domain';
import { type NameResolver } from '$lib/domain/ports';

export class NameResolverService {
  constructor(private readonly nameResolver: NameResolver) {}

  async verify(domain: UserDomain): Promise<boolean> {
    if (domain.verifiedAt) {
      return true;
    }
    const records = await this.nameResolver.resolveTxt(domain.domain);
    return records.some((record) => record.includes(domain.verifyTxtRecord));
  }
}
