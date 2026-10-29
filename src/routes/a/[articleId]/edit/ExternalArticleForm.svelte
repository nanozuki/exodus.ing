<script lang="ts">
  import Button from '#lib/component/Button.svelte';
  import Input from '#lib/component/Input.svelte';
  import { createOrUpdateExternalArticle } from './ExternalArticleForm.remote';
  import type { LoggedInUser } from '#lib/models/user.js';
  import type { ArticleContent } from '#lib/models/article.js';
  import { untrack } from 'svelte';

  type Props = {
    articleId?: string;
    replyToId?: string;
    article?: ArticleContent;
    user: LoggedInUser;
  };

  const { article: articleProp, articleId, replyToId, user }: Props = $props();

  const fields = createOrUpdateExternalArticle.fields;

  // Capture defaults once so query refreshes cannot overwrite unsaved edits.
  const article = untrack(() => articleProp);

  let hostname = $derived.by(() => {
    try {
      const url = fields.url.value() ?? article?.content;
      if (url) {
        const { hostname } = new URL(url);
        return hostname;
      }
    } catch {
      return undefined;
    }
  });
</script>

<form {...createOrUpdateExternalArticle} class="gap-y-m flex flex-col">
  {#if articleId}
    <input {...fields.articleId.as('hidden', articleId)} />
  {/if}
  {#if replyToId}
    <input {...fields.replyToId.as('hidden', replyToId)} />
  {/if}
  <Input {...fields.url.as('url', article?.content ?? '')} label="文章链接" issues={fields.url.issues()} required />
  <Input {...fields.title.as('text', article?.title ?? '')} label="文章标题" issues={fields.title.issues()} required />
  {#if hostname}
    <div class="bg-surface p-2">
      <p>提交前，请确保你为域名 {hostname} 设置了 TXT 类型的 DNS 记录：</p>
      <p class="font-mono break-all">exodus-site-verification={user.verifyCode}</p>
    </div>
  {/if}
  <Button variant="primary" type="submit">发布</Button>
</form>
