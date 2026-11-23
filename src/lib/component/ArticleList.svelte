<!--
  @component
  Render items in supplied order. When count exceeds the returned pageSize, show Pager using the paginated result’s
  count, pageSize, and pageNumber and the caller’s pageLink.
-->
<script lang="ts">
  import ArticleListItem from './ArticleListItem.svelte';
  import type { ArticleListItem as ArticleItem } from '#lib/models/article.js';
  import Pager from './Pager.svelte';
  import type { Paginated } from '#lib/models/page.js';
  import { twMerge } from 'tailwind-merge';

  interface Props {
    ['class']?: string;
    articles: Paginated<ArticleItem>;
    pageLink: (page: number) => string;
  }

  let { articles, pageLink, class: outerClass }: Props = $props();
  let { pageNumber, pageSize, count, items } = $derived(articles);
</script>

<div class={twMerge('gap-y-m flex flex-col', outerClass)}>
  <div class="gap-y-l flex flex-col">
    {#each items as a (a.id)}
      <ArticleListItem article={a} />
    {/each}
  </div>
  {#if count > pageSize}
    <Pager {count} {pageSize} page={pageNumber} {pageLink} />
  {/if}
</div>
