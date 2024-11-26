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
  tab: PageTab;
}

export type PageTab = 'articles' | 'bookmarks';

interface GetUserViewRequest {
  tab: PageTab;
  pageNumber: number;
  username: string;
  loggedInUser: User | null;
}

export class UserPage {
  constructor(
    private readonly user: UserService,
    private readonly articleList: ArticleListService,
  ) {}

  async getViewByUsernameOrId({ username, loggedInUser, tab, pageNumber }: GetUserViewRequest): Promise<UserView> {
    let user = await this.user.findUserByUsername(username);
    user = user ? user : await this.user.getUserById(username);
    const aboutMe = await compileMarkdown(user.aboutMe);
    let articles: Paginated<ArticleListItem>;
    if (tab === 'articles') {
      articles = await this.articleList.listByUserId(user.id, pageNumber);
    } else {
      articles = await this.getBookmarkedArticles(user.id, pageNumber);
    }
    return {
      user: {
        ...user,
        aboutMe,
      },
      articles,
      isMyself: loggedInUser ? user.id === loggedInUser.id : false,
      tab,
    };
  }

  async getBookmarkedArticles(userId: string, page: number): Promise<Paginated<ArticleListItem>> {
    return await this.articleList.listUserBookmarked(userId, page);
  }
}
