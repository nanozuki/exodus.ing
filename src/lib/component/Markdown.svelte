<script lang="ts">
  import type { Snippet } from 'svelte';
  import './markdown.css';

  interface MarkdownProps {
    content: string;
    title?: string;
    header?: Snippet;
    ['class']?: string;
  }

  const { title, content, header, class: classProp }: MarkdownProps = $props();
  const contents = $derived(title && header ? content.split(`<h1>${title}</h1>`, 2).map((s) => s.trim()) : [content]);
</script>

<article class={classProp}>
  {#each contents as content, i}
    {#if i === 0 && header && title}
      {#if content}
        <div class="markdown">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html content}
        </div>
      {/if}
      {#if header}
        {@render header()}
      {/if}
    {:else}
      <div class="markdown">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html content}
      </div>
    {/if}
  {/each}
</article>
