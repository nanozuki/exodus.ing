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
  bookmarks: Paginated<ArticleListItem>;
  isMyself: boolean;
}

interface GetUserViewRequest {
  pageNumber: number;
  username: string;
  loggedInUser: User | null;
}

export class UserPage {
  constructor(
    private readonly user: UserService,
    private readonly articleList: ArticleListService,
  ) {}

  async getViewByUsernameOrId({ username, loggedInUser, pageNumber }: GetUserViewRequest): Promise<UserView> {
    let user = await this.user.findUserByUsername(username);
    user = user ? user : await this.user.getUserById(username);
    const aboutMe = await compileMarkdown(user.aboutMe);
    const articles = await this.articleList.listByUserId(user.id, pageNumber);
    const bookmarks: Paginated<ArticleListItem> =
      loggedInUser && loggedInUser.id === user.id
        ? await this.articleList.listUserBookmarked(user.id, pageNumber)
        : { items: [], count: 0, pageNumber: 0 };
    return {
      user: {
        ...user,
        aboutMe,
      },
      articles,
      bookmarks,
      isMyself: loggedInUser ? user.id === loggedInUser.id : false,
    };
  }
}
