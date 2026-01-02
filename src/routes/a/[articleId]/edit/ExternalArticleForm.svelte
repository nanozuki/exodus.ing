<script lang="ts">
  import Button from '$lib/component/Button.svelte';
  import Input from '$lib/component/Input.svelte';
  import Form from '$lib/component/Form.svelte';
  import { createOrUpdateExternalArticle } from '$remotes/articles.remote';
  import type { LoggedInUser } from '$lib/domain/entities/user';
  import { createOrUpdateExternalArticleSchema } from '$remotes/schemas';
  import { catchError } from '$lib/errors';
  import type { ArticleContent } from '$lib/domain/entities/article';
  import { untrack } from 'svelte';

  type Props = {
    articleId?: string;
    replyToId?: string;
    article?: ArticleContent;
    user: LoggedInUser;
  };

  const { article: articleProp, articleId, replyToId, user }: Props = $props();
  const fields = createOrUpdateExternalArticle.fields;
  const article = untrack(() => articleProp);
  if (article) {
    fields.url.set(article.content);
    fields.title.set(article.title);
  }

  let formError = $state<string | null>(null);
  let hostname = $derived.by(() => {
    try {
      const url = fields.url.value();
      if (url) {
        const { hostname } = new URL(url);
        return hostname;
      }
    } catch {
      return undefined;
    }
  });
</script>

<Form
  {...createOrUpdateExternalArticle.preflight(createOrUpdateExternalArticleSchema).enhance(async ({ submit }) => {
    try {
      await submit();
    } catch (e) {
      const err = catchError(e);
      formError = err.message;
    }
  })}
  class="gap-y-m flex flex-col"
>
  <input type="hidden" name="articleId" value={articleId} />
  <input type="hidden" name="replyToId" value={replyToId} />
  <Input {...fields.url.as('url')} label="文章链接" issues={fields.url.issues()} required />
  <Input {...fields.title.as('text')} label="文章标题" issues={fields.title.issues()} required />
  {#if hostname}
    <div class="bg-surface p-2">
      <p>提交前，请确保你为域名 {hostname} 设置了以下 TXT 记录：</p>
      <p class="font-mono break-all">exodus-site-verification={user.verifyCode}</p>
    </div>
  {/if}
  {#if formError}
    <p class="text-error">{formError}</p>
  {/if}
  <Button variant="primary" type="submit">发布</Button>
</Form>
