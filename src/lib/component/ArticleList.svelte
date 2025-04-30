<script lang="ts">
  import ArticleListItem from '$lib/component/ArticleListItem.svelte';
  import type { ArticleListItem as ArticleItem } from '$lib/domain/entities/article';
  import ArticlePager from '$lib/component/ArticlePager.svelte';
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
  let hashedLink = $derived((page: number) => {
    return pageLink(page) + '#article-list';
  });
</script>

<div id="article-list" class={twMerge('flex flex-col', outerClass)}>
  {#if count > ARTICLE_PAGE_SIZE}
    <ArticlePager
      class="py-xs bg-base sticky top-0"
      {count}
      perPage={ARTICLE_PAGE_SIZE}
      page={pageNumber}
      pageLink={hashedLink}
    />
  {:else}
    <div class="pt-xs"></div>
  {/if}
  <div class="gap-y-l mt-m flex flex-col">
    {#each items as a (a.id)}
      <ArticleListItem article={a} />
    {/each}
  </div>
</div>
