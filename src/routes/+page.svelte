<script lang="ts">
  import ArticleHeader from '$lib/component/ArticleHeader.svelte';

  const { data } = $props();
</script>

<svelte:head>
  <title>EXODUS</title>
  <meta property="og:title" content="EXODUS" />
  <meta property="og:description" content="A blog platform for friends." />
</svelte:head>

{#if data.items.length === 0}
  <p>
    Nothing can save you except writing<br />
    by Charles Bukowski
  </p>
{/if}

<h5>文章列表</h5>

<div class="article-list">
  {#each data.items as article}
    <ArticleHeader {article} inList />
  {/each}
</div>

<style>
  h5 {
    font-weight: var(--font-weight-bold);
  }
  div.article-list {
    display: flex;
    flex-direction: column;
    row-gap: var(--space-l);
  }
</style>
