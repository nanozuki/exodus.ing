<script lang="ts">
  import ArticleList from '$lib/component/ArticleList.svelte';

  const { data } = $props();
  let { bookmarks } = $derived(data);
  const pageLink = (page: number) => `?page=${page}`;
</script>

{#if bookmarks.count === 0}
  <p>还没有收藏的文章</p>
{:else}
  <ArticleList articles={bookmarks} {pageLink} />
{/if}
