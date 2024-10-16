<script lang="ts">
  import Action from '$lib/component/Action.svelte';
  import { format, formatISO } from 'date-fns';
  const { data } = $props();
  const { comments, repliesCount, bookmarksCount } = data.interactions;
</script>

<svelte:head>
  <title>{data.article.title} - EXODUS</title>
  <meta property="og:title" content={data.article.title} />
  <meta property="og:type" content="article" />
  <meta
    property="og:description"
    content={`${data.article.author.username}, ${format(data.article.updatedAt, 'yyyy-MM-dd')}`}
  />
  <meta property="article:author" content={data.article.author.username} />
  <meta property="article:published_time" content={formatISO(data.article.createdAt)} />
  <meta property="article:modified_time" content={formatISO(data.article.updatedAt)} />
</svelte:head>

<p class="design">
  <i>by</i>
  <a class="username" href={`/u/${data.article.author.username}`}>{data.article.author.name}</a>
  <i>in</i>
  {format(data.article.createdAt, 'yyyy-MM-dd')}
  {#if data.myself}
    [<a href="/a/{data.article.id}/edit">编辑文章</a>]
  {/if}
</p>

<div class="interactives">
  <Action href="#comments">评论{comments.length > 0 ? ` ${comments.length}` : ''}</Action>
  {#if repliesCount > 0}<Action href="#replies">回复 {repliesCount}</Action>{/if}
  {#if bookmarksCount > 0}<Action href="#bookmarks">收藏 {bookmarksCount}</Action>{/if}
</div>

<article>
  {#if data.meta?.titleFrom === 'matter'}
    <h1>{data.meta?.title}</h1>
  {/if}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html data.file}
</article>

<div id="comments">
  <h2>评论</h2>
  <form>
    <textarea name="comment" placeholder="评论" required></textarea>
    <button type="submit">评论</button>
  </form>
</div>

<style>
  article {
    padding-bottom: 2rem;
  }
  div.interactives {
    display: flex;
    column-gap: 1rem;
    margin: 1rem 0;
  }
</style>
