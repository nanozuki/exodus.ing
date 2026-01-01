<script lang="ts">
  import type { Snippet } from 'svelte';
  import './markdown.css';

  interface MarkdownProps {
    markup: string;
    title?: string;
    header?: Snippet;
    ['class']?: string;
  }

  const { title, markup, header, class: classProp }: MarkdownProps = $props();
  const contents = $derived(title && header ? markup.split(`<h1>${title}</h1>`, 2).map((s) => s.trim()) : [markup]);
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
