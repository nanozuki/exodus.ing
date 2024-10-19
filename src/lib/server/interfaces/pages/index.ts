import type { Services } from '$lib/domain/services';
import { createLazyProxy } from '$lib/lazy';
import { ArticlePage } from './article_page';
import { HomePage } from './home_page';
import { RootLayout } from './root_layout';

export function buildPages(services: Services) {
  return createLazyProxy({
    rootLayout: () => new RootLayout(services.auth),
    homePage: () => new HomePage(services.articleList),
    articlePage: () => new ArticlePage(services.article, services.comment, services.bookmark),
  });
}
