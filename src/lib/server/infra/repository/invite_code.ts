import type { InviteCode, InviteCodeRepository } from '$lib/domain/entities/invite_code';
import { eq } from 'drizzle-orm/sql';
import { tInviteCode, type AppD1Database } from './schema';
import { wrap } from './utils';

export class D1InviteCodeRepository implements InviteCodeRepository {
  constructor(private db: AppD1Database) {}

  async findByCode(code: string): Promise<InviteCode | null> {
    return await wrap('inviteCode.findByCode', async () => {
      const inviteCodes = await this.db
        .select()
        .from(tInviteCode)
        .where(eq(tInviteCode.code, code));
      return inviteCodes.length !== 0 ? inviteCodes[0] : null;
    });
  }
}
