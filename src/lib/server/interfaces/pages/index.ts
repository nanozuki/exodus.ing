import type { Services } from '$lib/domain/services';
import { createLazyProxy } from '$lib/lazy';
import { ArticleEditPage } from './article_edit_page';
import { ArticlePage } from './article_page';
import { HomePage } from './home_page';
import { Layouts } from './layouts';

export function buildPages(services: Services) {
  return createLazyProxy({
    layouts: () => new Layouts(services.auth),
    homePage: () => new HomePage(services.articleList),
    articlePage: () => new ArticlePage(services.article, services.comment, services.bookmark),
    articleEditPage: () => new ArticleEditPage(services.article, services.auth),
  });
}
