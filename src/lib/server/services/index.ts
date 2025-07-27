import { ArticleService } from './article';
import { AuthService, type AuthAdapter } from './auth';
import { CommentService } from './comment';
import { FeedsService } from './feeds';
import { InviteCodeService } from './invite_code';

export interface AdapterSet {
  auth: AuthAdapter;
}

export function createServiceSet(adapters: AdapterSet) {
  return {
    article: new ArticleService(),
    auth: new AuthService(adapters.auth),
    comment: new CommentService(),
    feeds: new FeedsService(),
    inviteCode: new InviteCodeService(),
  };
}

export type ServiceSet = ReturnType<typeof createServiceSet>;
