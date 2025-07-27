import type { Session } from '$lib/domain/entities/session';
import { eq, lt } from 'drizzle-orm/sql';
import { tSession, type AppDatabase } from './schema';
import { newSessionCode } from './utils';

const EXPIRES_DURATION = 1000 * 60 * 60 * 24 * 30; // 30 days in milliseconds
const REFRESH_THRESHOLD = 1000 * 60 * 60 * 24 * 20;

export type ValidateSessionResult = {
  session: Session;
  refresh: boolean;
};

export class PgSessionRepository {
  constructor(private db: AppDatabase) {}

  async create(userId: string): Promise<Session> {
    const now = new Date();
    const sessionId = newSessionCode();
    const session: Session = {
      id: sessionId,
      userId,
      expiresAt: new Date(now.getTime() + EXPIRES_DURATION),
    };
    await this.db.insert(tSession).values(session);
    return session;
  }

  async validateSession(sessionId: string): Promise<ValidateSessionResult | null> {
    const now = new Date();
    const sessions = await this.db.select().from(tSession).where(eq(tSession.id, sessionId));
    if (sessions.length < 1) {
      return null;
    }
    const session = sessions[0];
    if (now.getTime() >= session.expiresAt.getTime()) {
      await this.db.delete(tSession).where(eq(tSession.id, session.id));
      return null;
    }
    const result = { session, refresh: false };
    if (now.getTime() >= session.expiresAt.getTime() - REFRESH_THRESHOLD) {
      session.expiresAt = new Date(now.getTime() + EXPIRES_DURATION);
      await this.db.update(tSession).set({ expiresAt: session.expiresAt }).where(eq(tSession.id, session.id));
      result.refresh = true;
    }
    return result;
  }

  async cleanAllExpired(): Promise<void> {
    const now = new Date();
    await this.db.delete(tSession).where(lt(tSession.expiresAt, now));
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.db.delete(tSession).where(eq(tSession.id, sessionId));
  }

  async invalidateAllSessions(userId: string): Promise<void> {
    await this.db.delete(tSession).where(eq(tSession.userId, userId));
  }
}
