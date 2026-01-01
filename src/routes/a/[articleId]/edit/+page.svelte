<script lang="ts">
  import Button from '$lib/component/Button.svelte';
  import ArticleCard from '$lib/component/ArticleCard.svelte';
  import MarkdownEditor from './MarkdownEditor.svelte';
  import { createOrUpdateMarkdownArticle, getArticleCardById, getArticleContentById } from '$remotes/articles.remote';

  const { data } = $props();
  const { articleId, replyToId } = $derived(data);
  const articleQ = $derived(articleId ? getArticleContentById(articleId) : undefined);
  const replyToQ = $derived(replyToId ? getArticleCardById(replyToId) : undefined);
  const article = $derived(articleQ ? await articleQ : undefined);
  const replyTo = $derived(replyToQ ? await replyToQ : undefined);

  let title: string = $derived(article?.title ?? '');
  let content: string = $derived(article?.content ?? '');
  console.log('Loaded data:', { title, content });
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

<div class="gap-y-m flex h-full flex-1 flex-col">
  {#if replyTo}
    <div class="gap-x-m bg-accent/10 flex flex-row p-2">
      <p class="font-bold">回应</p>
      <ArticleCard article={replyTo} />
    </div>
  {/if}

  <MarkdownEditor bind:article={content} {onValidateChange} {onTitleChange} />

  <form {...createOrUpdateMarkdownArticle}>
    <input type="hidden" name="articleId" value={articleId} />
    <input type="hidden" name="replyTo" value={replyToId} />
    <input type="hidden" name="content" value={content} />
    <Button variant={btnVariant} type="submit">发布</Button>
  </form>
</div>
