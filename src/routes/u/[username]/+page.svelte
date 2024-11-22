<script lang="ts">
  import SettingIcon from '~icons/mdi/settings-outline';
  import AddIcon from '~icons/mdi/add';
  import Markdown from '$lib/component/Markdown.svelte';
  import ArticleListItem from '$lib/component/ArticleListItem.svelte';

  const { data } = $props();
  let { user, articles, isMyself, tab, bookmarkedArticles } = $derived(data);
  const badgeClass = 'w-fit flex gap-x-1 items-center bg-accent-alt/20 hover:bg-accent-alt/30 py-1 px-2';
</script>

<svelte:head>
  <title>{user.username} - EXODUS</title>
  <meta property="og:title" content={user.username} />
</svelte:head>

{#if isMyself}
  <div class="flex gap-x-s w-fit border-accent-alt/60 text-accent-alt leading-relaxed">
    <a class={badgeClass} href="/settings">
      <SettingIcon /><span>设置</span>
    </a>
    <a class={badgeClass} href="/a/new/edit">
      <AddIcon /><span>新文章</span>
    </a>
  </div>
{/if}

<article>
  <h1 class="text-4xl font-serif font-bold">
    {user.name}
  </h1>
  {#if user.aboutMe}
    <Markdown content={user.aboutMe.toString()} />
  {/if}
</article>

<div class="flex flex-row border-b border-accent mb-xs">
  {#if tab === 'articles'}
    <h5 class="font-semibold px-s border-b-2 border-accent hover:bg-accent/20">文章列表</h5>
    {#if bookmarkedArticles.items.length > 0}
      <a href="?tab=bookmarks" class="text-lg font-semibold px-s hover:bg-accent/20">收藏列表</a>
    {/if}
  {:else}
    <a href="?tab=" class="text-lg font-semibold px-s hover:bg-accent/20">文章列表</a>
    <h5 class="font-semibold px-s border-b-2 border-accent hover:bg-accent/20">收藏列表</h5>
  {/if}
</div>

{#if tab === 'bookmarks'}
  <div class="flex flex-col gap-y-l">
    {#each bookmarkedArticles?.items || [] as article}
      <ArticleListItem {article} />
    {/each}
  </div>
{:else}
  <div class="flex flex-col gap-y-l">
    {#each articles.items as article}
      <ArticleListItem {article} />
    {/each}
  </div>
{/if}
