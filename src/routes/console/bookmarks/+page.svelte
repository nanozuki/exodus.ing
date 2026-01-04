<script lang="ts">
  import ArticleList from '$lib/component/ArticleList.svelte';
  import { page } from '$app/state';
  import { listBookmarkedArticles } from '$remotes/articles.remote';

  const currentPage = $derived(Math.max(1, parseInt(page.url.searchParams.get('page') || '1', 10) || 1));
  const articles = $derived(await listBookmarkedArticles(currentPage));
  const pageLink = (page: number) => `?page=${page}`;
</script>

{#if articles.count === 0}
  <p>还没有收藏的文章</p>
{:else}
  <ArticleList {articles} {pageLink} />
{/if}
