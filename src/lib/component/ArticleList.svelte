<script lang="ts">
  import ArticleListItem from '$lib/component/ArticleListItem.svelte';
  import type { ArticleListItem as ArticleItem } from '$lib/domain/entities/article';
  import Pager from '$lib/component/Pager.svelte';
  import type { Paginated } from '$lib/domain/values/page';
  import { ARTICLE_PAGE_SIZE } from '$lib/domain/entities/article.js';
  import { twMerge } from 'tailwind-merge';

  interface Props {
    ['class']?: string;
    articles: Paginated<ArticleItem>;
    pageLink: (page: number) => string;
  }

  let { articles, pageLink, class: outerClass }: Props = $props();
  let { pageNumber, count, items } = $derived(articles);
</script>

<div class={twMerge('gap-y-m flex flex-col', outerClass)}>
  <div class="gap-y-l flex flex-col">
    {#each items as a (a.id)}
      <ArticleListItem article={a} />
    {/each}
  </div>
  {#if count > ARTICLE_PAGE_SIZE}
    <Pager class="bg-base" {count} perPage={ARTICLE_PAGE_SIZE} page={pageNumber} {pageLink} />
  {/if}
</div>
