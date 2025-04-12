<script lang="ts">
  import { compileArticle, type ArticleCompileResult } from '$lib/markdown';
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import Markdown from '$lib/component/Markdown.svelte';
  import Button from '$lib/component/Button.svelte';
  import ArticleCard from '$lib/component/ArticleCard.svelte';

  const { form, data } = $props();

  let mode: 'editor' | 'previewer' = $state('editor');
  let article: string = $state(form?.content || data.article?.content || '');
  let articleSnapshot = $state('');
  let compiled: ArticleCompileResult = $state({ ok: false, title: '', value: '', errors: { noTitle: true } });
  let title = $derived.by(() => (compiled.ok ? compiled.title : ''));
  let content = $derived.by(() => compiled.value);
  let { replyTo } = $derived(data);

  let submitting = $state(false);
  const preSubmit = () => {
    submitting = true;
  };
  let btnVariant: 'primary' | 'disabled' = $derived(!submitting && compiled.ok ? 'primary' : 'disabled');

  const compile = () => {
    if (article !== articleSnapshot) {
      articleSnapshot = article;
      compileArticle(article).then((result) => {
        compiled = result;
      });
    }
  };

  onMount(() => {
    compile();
    const interval = setInterval(compile, 1000);
    return () => clearInterval(interval);
  });

  const buttonClass = {
    activated: 'flex-1 p-0.5 text-text bg-surface',
    deactivated: 'flex-1 p-0.5 text-subtle bg-highlight-high/30 hover:text-text',
  };
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

  <div class="switch border-border flex border">
    <button
      class={mode === 'editor' ? buttonClass.activated : buttonClass.deactivated}
      onclick={() => {
        mode = 'editor';
      }}>编辑</button
    >
    <button
      class={mode === 'previewer' ? buttonClass.activated : buttonClass.deactivated}
      onclick={() => {
        mode = 'previewer';
      }}>预览</button
    >
  </div>

  {#if mode === 'editor'}
    <textarea class="editor border-border w-full resize-none overflow-y-scroll border p-1" bind:value={article}
    ></textarea>
  {:else}
    <div class="editor border-border overflow-y-scroll border p-1">
      <Markdown content={content.toString()} />
    </div>
  {/if}

  {#if !compiled.ok}
    <div class="bg-error/30 text-error p-2">
      {#if compiled.errors.noTitle}
        <p class="font-bold">标题不能为空</p>
        <small>标题为第一个一级标题</small>
      {/if}
    </div>
  {/if}

  <form method="POST" use:enhance={preSubmit}>
    <input type="hidden" name="content" value={article} />
    <input type="hidden" name="title" value={title} />
    <input type="hidden" name="replyTo" value={replyTo?.id} />
    <Button variant={btnVariant} type="submit">发布</Button>
  </form>
</div>

<style>
  .editor {
    flex: 1 1 0;
  }
</style>
