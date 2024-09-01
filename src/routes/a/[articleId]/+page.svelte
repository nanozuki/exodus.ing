<script lang="ts">
  import { format, formatISO } from 'date-fns';
  const { data } = $props();
</script>

<svelte:head>
  <title>{data.article.title} - EXODUS</title>
  <meta property="og:title" content={data.article.title} />
  <meta property="og:type" content="article" />
  <meta
    property="og:description"
    content={`${data.article.username}, ${format(data.article.updatedAt, 'yyyy-MM-dd')}`}
  />
  <meta property="article:author" content={data.article.username} />
  <meta property="article:published_time" content={formatISO(data.article.createdAt)} />
  <meta property="article:modified_time" content={formatISO(data.article.updatedAt)} />
</svelte:head>

<p class="design">
  <i>by</i>
  <a class="username" href={`/u/${data.article.username}`}>{data.article.name}</a>
  <i>in</i>
  {format(data.article.createdAt, 'yyyy-MM-dd')}
  {#if data.myself}
    [<a href="/a/{data.article.id}/edit">编辑文章</a>]
  {/if}
</p>

<article>
  {#if data.meta?.titleFrom === 'matter'}
    <h1>{data.meta?.title}</h1>
  {/if}
  {@html data.file}
</article>

<style>
  article {
    padding-bottom: 2rem;
  }
</style>
