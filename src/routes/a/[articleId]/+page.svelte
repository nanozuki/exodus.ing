<script lang="ts">
  import Markdown from '$lib/component/Markdown.svelte';
  import { format, formatISO } from 'date-fns';
  const { data } = $props();
  const { article, user } = data;
</script>

<svelte:head>
  <title>{article.title} - EXODUS</title>
  <meta property="og:title" content={article.title} />
  <meta property="og:type" content="article" />
  <meta
    property="og:description"
    content={`${article.authorUsername}, ${format(article.updatedAt, 'yyyy-MM-dd')}`}
  />
  <meta property="article:author" content={article.authorUsername} />
  <meta property="article:published_time" content={formatISO(article.createdAt)} />
  <meta property="article:modified_time" content={formatISO(article.updatedAt)} />
</svelte:head>

<Markdown content={article.content.toString()} title={article.title}>
  {#snippet header()}
    <header>
      <h1>{article.title}</h1>
      <p>
        <i>by</i>
        <a class="username" href={`/u/${article.authorUsername}`}>{article.authorName}</a>
        <i>in</i>
        {format(article.createdAt, 'yyyy-MM-dd')}
        {#if user.isAuthor}
          [<a href="/a/{article.id}/edit">编辑文章</a>]
        {/if}
      </p>
    </header>
  {/snippet}
</Markdown>

<style>
  header {
    margin-top: 2em;
    margin-bottom: 1.5em;
  }
  p {
    color: var(--secondary-fg);
  }
</style>
