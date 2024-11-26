<script lang="ts">
  import ArticleList from '$lib/component/ArticleList.svelte';

  const { data } = $props();
  let { items } = $derived(data);
  const pageLink = (page: number) => `?page=${page}`;
</script>

<svelte:head>
  <title>EXODUS</title>
  <meta property="og:title" content="EXODUS" />
  <meta property="og:description" content="A blog platform for friends." />
</svelte:head>

{#if items.length === 0}
  <p>
    Nothing can save you except writing<br />
    by Charles Bukowski
  </p>
{/if}

<h5 class="font-semibold">文章列表</h5>

<ArticleList articles={data} {pageLink} />
