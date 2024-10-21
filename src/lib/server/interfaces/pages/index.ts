import type { Services } from '$lib/domain/services';
import { createLazyProxy } from '$lib/lazy';
import { ArticleEditPage } from './article_edit_page';
import { ArticlePage } from './article_page';
import { AuthPage } from './auth_page';
import { HomePage } from './home_page';
import { Layouts } from './layouts';
import { SettingsPage } from './settings_page';

export function buildPages(services: Services) {
  return createLazyProxy({
    articleEditPage: () => new ArticleEditPage(services.article, services.auth),
    articlePage: () => new ArticlePage(services.article, services.comment, services.bookmark),
    authPage: () => new AuthPage(services.auth, services.user, services.inviteCode),
    homePage: () => new HomePage(services.articleList),
    layouts: () => new Layouts(services.auth),
    settingsPage: () => new SettingsPage(services.user, services.userDomain, services.nameResolver),
  });
}
