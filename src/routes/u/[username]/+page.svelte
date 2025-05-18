<script lang="ts">
  import SettingIcon from '~icons/mdi/settings-outline';
  import AddIcon from '~icons/mdi/add';
  import Markdown from '$lib/component/Markdown.svelte';
  import ArticleList from '$lib/component/ArticleList.svelte';

  const { data } = $props();
  let { user, articles, isMyself } = $derived(data);
  const badgeClass = 'w-fit flex gap-x-1 items-center bg-accent-alt/20 hover:bg-accent-alt/30 py-1 px-2';
  const pageLink = (page: number) => `?page=${page}`;
</script>

<svelte:head>
  <title>{user.username} - EXODUS</title>
  <meta property="og:title" content={user.username} />
</svelte:head>

{#if isMyself}
  <div class="gap-x-s border-accent-alt/60 text-accent-alt flex w-fit leading-relaxed">
    <a class={badgeClass} href="/console">
      <SettingIcon /><span>控制台</span>
    </a>
    <a class={badgeClass} href="/a/new/edit">
      <AddIcon /><span>新文章</span>
    </a>
  </div>
{/if}

<article>
  <h1 class="font-serif text-4xl font-bold">
    {user.name}
  </h1>
  {#if user.aboutMe}
    <Markdown content={user.aboutMe.toString()} />
  {/if}
</article>

<div class="gap-y-xs flex flex-col">
  <h5 class="font-semibold">文章列表</h5>
  <ArticleList {articles} {pageLink} />
</div>
