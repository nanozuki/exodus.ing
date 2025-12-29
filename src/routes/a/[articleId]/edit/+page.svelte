<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/component/Button.svelte';
  import ArticleCard from '$lib/component/ArticleCard.svelte';
  import MarkdownEditor from './MarkdownEditor.svelte';

  const { form, data } = $props();

  let article: string = $derived(form?.content || data.article?.content || '');
  let title: string = $derived(data.article?.title || '');
  let valid: boolean = $state(false);
  const onValidateChange = (isValid: boolean) => {
    valid = isValid;
  };
  const onTitleChange = (newTitle: string) => {
    title = newTitle;
  };

  let { replyTo } = $derived(data);

  let submitting = $state(false);
  const preSubmit = () => {
    submitting = true;
  };
  let btnVariant: 'primary' | 'disabled' = $derived(!valid || submitting ? 'disabled' : 'primary');
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

  <MarkdownEditor bind:article {onValidateChange} {onTitleChange} />

  <form method="POST" use:enhance={preSubmit}>
    <input type="hidden" name="content" value={article} />
    <input type="hidden" name="title" value={title} />
    <input type="hidden" name="replyTo" value={replyTo?.id} />
    <Button variant={btnVariant} type="submit">发布</Button>
  </form>
</div>
