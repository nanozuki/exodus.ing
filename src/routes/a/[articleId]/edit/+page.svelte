<script lang="ts">
  import { compileArticle, type ArticleCompileResult } from '$lib/markdown';
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import Markdown from '$lib/component/Markdown.svelte';
  import Button from '$lib/component/Button.svelte';

  const { form, data } = $props();

  let mode: 'editor' | 'previewer' = $state('editor');
  let article: string = $state(form?.content || data.content);
  let articleSnapshot = $state('');
  let compiled: ArticleCompileResult = $state({ ok: true, title: '', value: '' });
  let title = $derived.by(() => (compiled.ok ? compiled.title : ''));
  let content = $derived.by(() => compiled.value);

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

<div class="flex-1 h-full flex flex-col gap-y-m">
  <!-- Row 1 -->
  <div class="switch flex border border-border">
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

  <!-- Row 2 -->
  {#if mode === 'editor'}
    <textarea
      class="editor border border-border overflow-y-scroll p-1 w-full resize-none"
      bind:value={article}
    ></textarea>
  {:else}
    <div class="editor border border-border overflow-y-scroll p-1">
      <Markdown content={content.toString()} />
    </div>
  {/if}

  <!-- Row 3 -->
  {#if !compiled.ok}
    <div class="bg-error/30 text-error p-2">
      {#if compiled.errors.noTitle}
        <p class="font-bold">标题不能为空</p>
        <small>标题为第一个一级标题</small>
      {/if}
    </div>
  {/if}

  <!-- Row 4 -->
  <form method="POST" use:enhance>
    <input type="hidden" name="content" value={article} />
    <input type="hidden" name="title" value={title} />
    <Button variant="primary" type="submit">发布</Button>
  </form>
</div>

<style>
  .editor {
    flex: 1 1 0;
  }
</style>
