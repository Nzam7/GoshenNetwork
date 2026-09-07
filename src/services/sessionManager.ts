import { UserSession, SessionState } from '../models/session';

export class SessionManager {
  private sessions: Map<string, UserSession> = new Map();
  private sessionTimeoutMs: number;

  constructor(sessionTimeoutMinutes: number = 15) {
    this.sessionTimeoutMs = sessionTimeoutMinutes * 60 * 1000;
  }

  public getSession(userId: string): UserSession {
    const existing = this.sessions.get(userId);
    const now = new Date();

    if (!existing) {
      const newSession: UserSession = {
        userId,
        state: SessionState.GREETING,
        updatedAt: now,
      };
      this.sessions.set(userId, newSession);
      return newSession;
    }

    // Check for expiration
    if (now.getTime() - existing.updatedAt.getTime() > this.sessionTimeoutMs) {
      existing.state = SessionState.GREETING;
      existing.lastCategory = undefined;
      existing.lastKeyword = undefined;
    }

    existing.updatedAt = now;
    return existing;
  }

  public updateSession(
    userId: string,
    state: SessionState,
    meta?: { lastCategory?: string; lastKeyword?: string }
  ): UserSession {
    const session = this.getSession(userId);
    session.state = state;
    session.updatedAt = new Date();

    if (meta?.lastCategory !== undefined) {
      session.lastCategory = meta.lastCategory;
    }
    if (meta?.lastKeyword !== undefined) {
      session.lastKeyword = meta.lastKeyword;
    }

    this.sessions.set(userId, session);
    return session;
  }

  public clearSession(userId: string): void {
    this.sessions.delete(userId);
  }
}
