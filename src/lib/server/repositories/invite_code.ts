import type { InviteCode, InviteCodeInput, InviteCodeRepository } from '$lib/domain/entities/invite_code';
import { and, eq, isNull } from 'drizzle-orm/sql';
import { tInviteCode, type AppDatabase } from './schema';
import { newCode, wrap } from './utils';

export class SqliteInviteCodeRepository implements InviteCodeRepository {
  constructor(private db: AppDatabase) {}

  async create(input: InviteCodeInput): Promise<InviteCode> {
    return await wrap('inviteCode.create', async () => {
      const { inviterId, roleKey, validFrom, validTo } = input;
      const code = newCode();
      const inviteCode = {
        code,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        inviterId,
        roleKey,
        usedAt: null,
      };
      const ids = await this.db.insert(tInviteCode).values(inviteCode).returning({ id: tInviteCode.id });
      return { ...inviteCode, id: ids[0].id };
    });
  }

  async findByCode(code: string): Promise<InviteCode | null> {
    return await wrap('inviteCode.findByCode', async () => {
      const inviteCodes = await this.db.select().from(tInviteCode).where(eq(tInviteCode.code, code));
      return inviteCodes.length !== 0 ? inviteCodes[0] : null;
    });
  }

  async useCode(code: string): Promise<void> {
    return await wrap('inviteCode.useCode', async () => {
      const now = new Date();
      await this.db
        .update(tInviteCode)
        .set({ usedAt: now })
        .where(and(eq(tInviteCode.code, code), isNull(tInviteCode.usedAt)))
        .execute();
    });
  }
}
