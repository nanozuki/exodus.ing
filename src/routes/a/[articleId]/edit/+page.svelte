<script lang="ts">
  import { compile, type File } from '$lib/markdown';
  import { onMount } from 'svelte';

  const { form, data } = $props();

  let mode: 'editor' | 'previewer' = $state('editor');
  let article: string = $state(form?.content || data.content);
  let compiled: File | undefined = $state(undefined);
  let title = $derived.by(() => (compiled ? compiled.data.meta?.title : data.title));

  let articleSnapshot = '';
  onMount(() => {
    setInterval(() => {
      if (article !== articleSnapshot) {
        articleSnapshot = article;
        compile(article).then((result) => {
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
  <h1 class="design">{title ? title : '无标题'}</h1>

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
    <textarea bind:value={article}></textarea>
  {:else}
    <article>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {#if compiled}{@html compiled}{/if}
    </article>
  {/if}

  <form method="POST">
    <input type="hidden" name="content" value={article} />
    <input type="hidden" name="title" value={title} />
    <small class:error={form?.error}
      >{form?.error ? form?.error + '。' : ''}
      文章标题来自 frontmatter 里的 “title” 或者第一个一级标题。</small
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
  article {
    flex: 1;
    overflow-y: scroll;
  }
  small.error {
    color: var(--red);
  }
  form button {
    width: 100%;
  }
</style>
