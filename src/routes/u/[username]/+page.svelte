<script lang="ts">
  import { format } from 'date-fns';
  import SettingIcon from '~icons/mdi/settings-outline';
  import AddIcon from '~icons/mdi/add';
  import Action from '$lib/component/Action.svelte';
  import Markdown from '$lib/component/Markdown.svelte';

  const { data } = $props();
  const { user, articles, isMyself } = data;
</script>

<svelte:head>
  <title>{user.username} - EXODUS</title>
  <meta property="og:title" content={user.username} />
</svelte:head>

<article>
  <h1>
    {user.name}
    {#if isMyself}
      <Action href="/settings"><SettingIcon />设置</Action>
    {/if}
  </h1>
  {#if user.aboutMe}
    <Markdown content={user.aboutMe.toString()} />
  {/if}
</article>

<h4>
  文章列表
  {#if isMyself}
    <Action href="/a/new/edit"><AddIcon />新文章</Action>
  {/if}
</h4>

<div class="article-list">
  {#each articles.items as article}
    <article>
      <a href="/a/{article.id}">
        <h2 class="design">{article.title}</h2>
      </a>
      <p class="design">
        <i>by</i>
        {article.authorName}
        <i>in</i>
        {format(article.createdAt, 'yyyy-MM-dd')}
        {#if isMyself}
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
