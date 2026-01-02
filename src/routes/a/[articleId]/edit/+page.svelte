<script lang="ts">
  import ArticleCard from '$lib/component/ArticleCard.svelte';
  import Button from '$lib/component/Button.svelte';
  import ButtonLink from '$lib/component/ButtonLink.svelte';
  import MarkdownEditor from './MarkdownEditor.svelte';
  import { createOrUpdateMarkdownArticle, getArticleCardById, getArticleContentById } from '$remotes/articles.remote';
  import ExternalArticleForm from './ExternalArticleForm.svelte';

  const { data } = $props();
  const { articleId, replyToId, user } = $derived(data);
  const articleQ = $derived(articleId ? getArticleContentById(articleId) : undefined);
  const replyToQ = $derived(replyToId ? getArticleCardById(replyToId) : undefined);
  const article = $derived(articleQ ? await articleQ : undefined);
  const replyTo = $derived(replyToQ ? await replyToQ : undefined);
  const contentType = $derived(article ? article.contentType : data.contentType);

  let title: string = $derived(article?.title ?? '');
  let content: string = $derived(article?.content ?? '');
  let valid: boolean = $state(false);
  const onValidateChange = (isValid: boolean) => {
    valid = isValid;
  };
  const onTitleChange = (newTitle: string) => {
    title = newTitle;
  };

  let btnVariant: 'primary' | 'disabled' = $derived(valid ? 'primary' : 'disabled');
</script>

<svelte:head>
  <title>编辑 {title} - EXODUS</title>
</svelte:head>

{#if contentType === 'markdown'}
  <div class="gap-y-m flex h-full flex-1 flex-col">
    {#if replyTo}
      <div class="gap-x-m bg-accent/10 flex flex-row p-2">
        <p class="font-bold">回应</p>
        <ArticleCard article={replyTo} />
      </div>
    {/if}

    <MarkdownEditor bind:content {onValidateChange} {onTitleChange} />

    <form {...createOrUpdateMarkdownArticle}>
      <input type="hidden" name="articleId" value={articleId} />
      <input type="hidden" name="replyToId" value={replyToId} />
      <input type="hidden" name="content" value={content} />
      <Button variant={btnVariant} type="submit">发布</Button>
    </form>
  </div>
{:else if contentType === 'external'}
  <ExternalArticleForm {articleId} {replyToId} {user} />
{:else}
  <h2 class="font-serif text-2xl font-bold">添加新文章</h2>
  <h5 class="font-sans font-semibold">请选择方式</h5>
  <div class="bg-accent-alt/10 p-m gap-m flex flex-col">
    <p>使用 Markdown 添加文章，可以直接在 Exodus 内撰写和编辑。文章内容可以直接在站内完整阅读并支持所有的互动功能</p>
    <ButtonLink href="/a/new/edit?contentType=markdown" variant="primary">创建 Markdown 文章</ButtonLink>
  </div>
  <div class="bg-accent-alt/10 p-m gap-m flex flex-col">
    <p>链接到你在其他网页上发表的文章，需要验证作者身份。在 Exodus 不展示文章内容，但仍支持评论回应等互动功能</p>
    <ButtonLink variant="primary" href="/a/new/edit?contentType=external">链接外部文章</ButtonLink>
  </div>
{/if}
