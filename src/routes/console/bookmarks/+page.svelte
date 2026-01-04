<script lang="ts">
  import ArticleList from '$lib/component/ArticleList.svelte';
  import { page } from '$app/state';
  import { getConsoleBookmarks } from '$remotes/console.remote';

  const currentPage = $derived(Math.max(1, parseInt(page.url.searchParams.get('page') || '1', 10) || 1));
  const bookmarks = $derived(await getConsoleBookmarks(currentPage));
  const pageLink = (page: number) => `?page=${page}`;
</script>

{#if bookmarks.count === 0}
  <p>还没有收藏的文章</p>
{:else}
  <ArticleList articles={bookmarks} {pageLink} />
{/if}
