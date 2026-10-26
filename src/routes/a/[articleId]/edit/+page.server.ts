import type { ArticleContentType } from '$lib/domain/entities/article';
import type { PageServerLoad } from './$types';
import { Permission } from '$lib/domain/entities/role';
import { repositories } from '$lib/server/registry';
import { throwError } from '$lib/errors';

function parseContentType(url: URL): ArticleContentType | null {
  const contentType = url.searchParams.get('contentType');
  return contentType === 'markdown' || contentType === 'external' ? contentType : null;
}

/** Allow article creation for authors and editing only for the article's owner. */
export const load: PageServerLoad = async ({ locals, params, url }) => {
  const user = locals.requirePermission(Permission.CreateArticle, '编辑文章');
  const articleId = params.articleId === 'new' ? undefined : params.articleId;
  if (articleId) {
    const article = await repositories.article.getById(articleId);
    if (article.authorId !== user.id) {
      return throwError('FORBIDDEN', { operation: '编辑其他作者的文章' });
    }
  }
  const replyTo = url.searchParams.get('replyTo');
  return {
    replyToId: replyTo ? replyTo : undefined,
    articleId,
    contentType: parseContentType(url),
    user,
  };
};
