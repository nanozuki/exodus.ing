<script lang="ts">
  import ArticleListItem from '$lib/component/ArticleListItem.svelte';

  const { data } = $props();
  const { items } = $derived(data);
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

<div class="flex flex-col gap-y-l">
  <h5 class="font-semibold">文章列表</h5>

  {#each items as article}
    <ArticleListItem {article} />
  {/each}
</div>
