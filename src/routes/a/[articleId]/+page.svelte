<script lang="ts">
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

<p class="design">
  <i>by</i>
  <a class="username" href={`/u/${article.authorUsername}`}>{article.authorName}</a>
  <i>in</i>
  {format(article.createdAt, 'yyyy-MM-dd')}
  {#if user.isAuthor}
    [<a href="/a/{article.id}/edit">编辑文章</a>]
  {/if}
</p>

<article>
  {#if article.meta.titleSource === 'frontmatter'}
    <h1>{article.title}</h1>
  {/if}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html article.content}
</article>
