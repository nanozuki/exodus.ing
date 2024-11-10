<script lang="ts">
  import SettingIcon from '~icons/mdi/settings-outline';
  import AddIcon from '~icons/mdi/add';
  import Markdown from '$lib/component/Markdown.svelte';
  import ArticleListItem from '$lib/component/ArticleListItem.svelte';

  const { data } = $props();
  const { user, articles, isMyself } = $derived(data);
  const badgeClass = 'w-fit flex gap-x-1 items-center bg-accent-alt/20 hover:bg-accent-alt/30 py-1 px-2';
</script>

<svelte:head>
  <title>{user.username} - EXODUS</title>
  <meta property="og:title" content={user.username} />
</svelte:head>

{#if isMyself}
  <div class="flex gap-x-s w-fit border-accent-alt/60 text-accent-alt leading-relaxed">
    <a class={badgeClass} href="/settings">
      <SettingIcon />设置
    </a>
    <a class={badgeClass} href="/a/new/edit">
      <AddIcon />新文章
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

<div class="flex flex-col gap-y-l border-t border-border pt-m">
  <h5 class="font-semibold">文章列表</h5>
  {#each articles.items as article}
    <ArticleListItem {article} />
  {/each}
</div>
