import type { ArticleListItem } from '$lib/domain/entities/article';
import type { User } from '$lib/domain/entities/user';
import type { ArticleListService } from '$lib/domain/services/article_list';
import type { UserService } from '$lib/domain/services/user';
import type { Paginated } from '$lib/domain/values/page';
import { compileMarkdown } from '$lib/markdown';
import type { Value } from 'vfile';

export interface UserView {
  user: Omit<User, 'aboutMe'> & { aboutMe: Value };
  articles: Paginated<ArticleListItem>;
  isMyself: boolean;
}

export class UserPage {
  constructor(
    private readonly user: UserService,
    private readonly articleList: ArticleListService,
  ) {}

  async getViewByUsernameOrId(username: string, loggedInUser: User | null): Promise<UserView> {
    let user = await this.user.findUserByUsername(username);
    user = user ? user : await this.user.getUserById(username);
    const aboutMe = await compileMarkdown(user.aboutMe);
    const articles = await this.articleList.listArticlesByUserId(user.id, { size: 10, number: 0 });
    return {
      user: {
        ...user,
        aboutMe,
      },
      articles,
      isMyself: loggedInUser ? user.id === loggedInUser.id : false,
    };
  }
}
