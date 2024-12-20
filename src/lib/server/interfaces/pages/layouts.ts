import type { User } from '$lib/domain/entities/user';
import type { AuthService } from '$lib/domain/services/auth';

export class Layouts {
  constructor(private readonly auth: AuthService) {}

  get loggedInUser(): User | null {
    return this.auth.loggedInUser;
  }

  async loadSession(): Promise<void> {
    await this.auth.loadSession();
  }

  requireLoggedInUser(context?: string): User {
    return this.auth.requireLoggedInUser(context);
  }
}
