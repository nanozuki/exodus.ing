import type {
  InviteCode,
  InviteCodeCard,
  InviteCodeInput,
  InviteCodeRepository,
  InviteQuotaAlgorithm,
} from '$lib/domain/entities/invite_code';
import { and, eq, isNull } from 'drizzle-orm/sql';
import { tArticle, tInviteCode, type AppDatabase } from './schema';
import { newCode, wrap } from './utils';
import { AppError } from '$lib/errors';

export class SqliteInviteCodeRepository implements InviteCodeRepository {
  constructor(private db: AppDatabase) {}

  async create(input: InviteCodeInput, algo: InviteQuotaAlgorithm): Promise<InviteCode> {
    const { inviterId, roleKey } = input;
    return await wrap('inviteCode.create', async () => {
      return await this.db.transaction(
        async (tx) => {
          const articleCount = await tx.$count(tArticle, eq(tArticle.userId, inviterId));
          const validCodeCount = await tx.$count(
            tInviteCode,
            and(eq(tInviteCode.inviterId, inviterId), isNull(tInviteCode.usedAt)),
          );
          const quota = algo({ articleCount, validCodeCount });
          if (quota <= 0) {
            return AppError.Forbidden('Invite code quota is exhausted').throw();
          }

          const code = newCode();
          const inviteCode = {
            code,
            inviterId,
            roleKey,
            usedAt: null,
          };
          const ids = await this.db.insert(tInviteCode).values(inviteCode).returning({ id: tInviteCode.id });
          return { ...inviteCode, id: ids[0].id };
        },
        { behavior: 'immediate' },
      );
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

  async getUserUnusedCodes(userId: string): Promise<InviteCodeCard[]> {
    return await wrap('inviteCode.getUserUnusedCodes', async () => {
      const codes = await this.db
        .select()
        .from(tInviteCode)
        .where(and(eq(tInviteCode.inviterId, userId), isNull(tInviteCode.usedAt)));
      return codes.map(({ code, roleKey }) => ({ code, roleKey }));
    });
  }

  async getUserInviteQuota(userId: string, algo: InviteQuotaAlgorithm): Promise<number> {
    return await wrap('inviteCode.getUserInviteQuota', async () => {
      const articleCount = await this.db.$count(tArticle, eq(tArticle.userId, userId));
      const validCodeCount = await this.db.$count(
        tInviteCode,
        and(eq(tInviteCode.inviterId, userId), isNull(tInviteCode.usedAt)),
      );
      return algo({ articleCount, validCodeCount });
    });
  }
}
