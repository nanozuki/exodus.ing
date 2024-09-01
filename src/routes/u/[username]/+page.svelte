<script lang="ts">
  import { format } from 'date-fns';

  const { data } = $props();
</script>

<svelte:head>
  <title>{data.user?.username} - EXODUS</title>
  <meta property="og:title" content={data.user?.username} />
</svelte:head>

<article>
  <h1>
    {data.user!.username}
    {#if data.isMyself}
      <a class="button" href="/settings">设置</a>
    {/if}
  </h1>
  {#if data.aboutMe}
    {@html data.aboutMe}
  {/if}
</article>

<h4>
  文章列表
  {#if data.isMyself}
    <a class="button" href="/a/new/edit">+ 新文章</a>
  {/if}
</h4>

<div class="article-list">
  {#each data.articles as article}
    <article>
      <a href="/a/{article.articleId}">
        <h2 class="design">{article.title}</h2>
      </a>
      <p class="design">
        <i>by</i>
        {article.name}
        <i>in</i>
        {format(article.createdAt, 'yyyy-MM-dd')}
        {#if data.isMyself}
          <a href="/a/{article.articleId}/edit">[编辑]</a>
        {/if}
      </p>
    </article>
  {/each}
</div>

<style>
  a.button {
    display: inline;
    font-size: 1rem;
    padding: 0 1rem;
    background-color: var(--green);
    color: var(--primary-bg);
    text-decoration: none;
    margin-left: 0.5rem;
  }

  div.article-list {
    display: flex;
    flex-direction: column;
    row-gap: 1rem;
  }
  article i {
    color: var(--teritary-fg);
  }
</style>
