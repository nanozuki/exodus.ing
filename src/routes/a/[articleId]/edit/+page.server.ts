import type { ArticleContentType } from '$lib/domain/entities/article';
import type { PageServerLoad } from './$types';
import { Permission } from '$lib/domain/entities/role';

function parseContentType(url: URL): ArticleContentType | null {
  const contentType = url.searchParams.get('contentType');
  return contentType === 'markdown' || contentType === 'external' ? contentType : null;
}

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const user = locals.requirePermission(Permission.CreateArticle, '编辑文章');
  const replyTo = url.searchParams.get('replyTo');
  return {
    replyToId: replyTo ? replyTo : undefined,
    articleId: params.articleId === 'new' ? undefined : params.articleId,
    contentType: parseContentType(url),
    user,
  };
};
