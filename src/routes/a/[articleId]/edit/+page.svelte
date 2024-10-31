<script lang="ts">
  import { compileArticle, type ArticleCompileResult } from '$lib/markdown';
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import Markdown from '$lib/component/Markdown.svelte';

  const { form, data } = $props();

  let mode: 'editor' | 'previewer' = $state('editor');
  let article: string = $state(form?.content || data.content);
  let compiled: ArticleCompileResult | undefined = $state(undefined);
  let title = $derived.by(() => (compiled ? (compiled.ok ? compiled.title : '') : data.title));
  let content = $derived.by(() => (compiled ? compiled.value : data.content));

  let articleSnapshot = '';
  onMount(() => {
    setInterval(() => {
      if (article !== articleSnapshot) {
        articleSnapshot = article;
        compileArticle(article).then((result) => {
          compiled = result;
        });
      }
    }, 1000);
  });
</script>

<svelte:head>
  <title>编辑 {title ? title : '无标题'} - EXODUS</title>
</svelte:head>

<div class="container">
  <div class="switch">
    <button
      class:activate={mode === 'editor'}
      onclick={() => {
        mode = 'editor';
      }}>编辑</button
    >
    <button
      class:activate={mode === 'previewer'}
      onclick={() => {
        mode = 'previewer';
      }}>预览</button
    >
  </div>

  {#if mode === 'editor'}
    <h1>{title ? title : '无标题'}</h1>
    <textarea bind:value={article}></textarea>
  {:else}
    <div class="previewer">
      <Markdown content={content.toString()} />
    </div>
  {/if}

  <form method="POST" use:enhance>
    <input type="hidden" name="content" value={article} />
    <input type="hidden" name="title" value={title} />
    <small class:error={form?.error}
      >{form?.error ? form?.error + '。' : ''}
      文章标题来自第一个一级标题。</small
    >
    <button type="submit" class="positive">发布</button>
  </form>
</div>

<style>
  div.container {
    height: calc(100svh - 4rem);
    display: flex;
    flex-direction: column;
    row-gap: 1rem;
    padding-bottom: 1rem;
  }

  div.switch {
    display: flex;
    border: 1px solid var(--green);
  }
  div.switch button {
    flex: 1;
    background-color: var(--secondary-bg);
    border: none;
  }
  div.switch button.activate {
    color: var(--primary-bg);
    background-color: var(--green);
  }

  textarea {
    width: 100%;
    flex: 1;
    resize: none;
  }
  .previewer {
    flex: 1;
    overflow-y: scroll;
    border: var(--border-line);
    padding: var(--space-2xs);
  }
  small.error {
    color: var(--red);
  }
  form button {
    width: 100%;
  }
</style>
