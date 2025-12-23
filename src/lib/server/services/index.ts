import { ArticleService } from './article';
import { AuthService } from './auth';
import { CommentService } from './comment';
import { FeedsService } from './feeds';
import { InviteCodeService } from './invite_code';

export function createServiceSet() {
  return {
    article: new ArticleService(),
    auth: new AuthService(),
    comment: new CommentService(),
    feeds: new FeedsService(),
    inviteCode: new InviteCodeService(),
  };
}

export type ServiceSet = ReturnType<typeof createServiceSet>;
