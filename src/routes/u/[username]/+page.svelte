<script lang="ts">
  import { format } from 'date-fns';
  import SettingIcon from '~icons/mdi/settings-outline';
  import AddIcon from '~icons/mdi/add';
  import Action from '$lib/component/Action.svelte';

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
      <Action href="/settings"><SettingIcon />设置</Action>
    {/if}
  </h1>
  {#if data.aboutMe}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html data.aboutMe}
  {/if}
</article>

<h4>
  文章列表
  {#if data.isMyself}
    <Action href="/a/new/edit"><AddIcon />新文章</Action>
  {/if}
</h4>

<div class="article-list">
  {#each data.articles as article}
    <article>
      <a href="/a/{article.id}">
        <h2 class="design">{article.title}</h2>
      </a>
      <p class="design">
        <i>by</i>
        {article.author.name}
        <i>in</i>
        {format(article.createdAt, 'yyyy-MM-dd')}
        {#if data.isMyself}
          <a href="/a/{article.id}/edit">[编辑]</a>
        {/if}
      </p>
    </article>
  {/each}
</div>

<style>
  div.article-list {
    display: flex;
    flex-direction: column;
    row-gap: 1rem;
  }
  article i {
    color: var(--teritary-fg);
  }
</style>
