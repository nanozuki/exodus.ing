<!--
  @component
  The homepage: the article list for the `page` search parameter, with `?page=<n>` links, an empty state, the EXODUS
  title, and social metadata. The server awaits the first page; client navigation changes the query argument.
-->
<script lang="ts">
  import ArticleList from '#lib/component/ArticleList.svelte';
  import { loadPageData } from './page.remote';
  import { page } from '$app/state';

  const { articles } = $derived(await loadPageData({ page: page.url.searchParams.get('page') }));

  const pageLink = (page: number) => `?page=${page}`;
</script>

<svelte:head>
  <title>EXODUS</title>
  <meta property="og:title" content="EXODUS" />
  <meta property="og:description" content="A blog platform for friends." />
</svelte:head>

{#if articles.items.length === 0}
  <p>
    Nothing can save you except writing<br />
    by Charles Bukowski
  </p>
{/if}

<h5 class="font-semibold">文章列表</h5>

<ArticleList {articles} {pageLink} />
