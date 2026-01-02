<script lang="ts">
  import Button from '$lib/component/Button.svelte';
  import Input from '$lib/component/Input.svelte';
  import Form from '$lib/component/Form.svelte';
  import { createOrUpdateExternalArticle } from '$remotes/articles.remote';
  import type { LoggedInUser } from '$lib/domain/entities/user';
  import { createOrUpdateExternalArticleSchema } from '$remotes/schemas';
  import { catchError } from '$lib/errors';

  type Props = {
    articleId?: string;
    replyToId?: string;
    user: LoggedInUser;
  };

  const { articleId, replyToId, user }: Props = $props();
  const fields = $derived(createOrUpdateExternalArticle.fields);
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
  let formError = $state<string | null>(null);
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
      <p>添加文章前，请确保你为域名 {hostname} 设置了以下 TXT 记录：</p>
      <p class="font-mono break-all">exodus-site-verification={user.verifyCode}</p>
    </div>
  {/if}
  {#if formError}
    <p class="text-error">{formError}</p>
  {/if}
  <Button variant="primary" type="submit">发布</Button>
</Form>
