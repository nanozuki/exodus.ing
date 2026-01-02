<script lang="ts">
  import AddIcon from '~icons/mdi/add';
  import ArticleList from '$lib/component/ArticleList.svelte';
  import CommentList from '$lib/component/CommentList.svelte';
  import Markdown from '$lib/component/Markdown.svelte';
  import SettingIcon from '~icons/mdi/settings-outline';

  const { data } = $props();
  let { user, listData, isMyself, isWriter } = $derived(data);
  const badgeClass = 'w-fit flex gap-x-1 items-center bg-accent-alt/20 hover:bg-accent-alt/30 py-1 px-2';
  const pageLink = $derived((page: number) => `?tab=${listData.tab}&page=${page}#list-top`);
  const routes = $derived(
    listData.tabs.map((tab) => {
      return tab === 'articles'
        ? { route: `?tab=${tab}#list-top`, title: '文章列表', current: listData.tab === 'articles' }
        : { route: `?tab=${tab}#list-top`, title: '评论列表', current: listData.tab === 'comments' };
    }),
  );
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
    {#if isWriter}
      <a class={badgeClass} href="/a/new/edit">
        <AddIcon /><span>新文章</span>
      </a>
    {/if}
  </div>
{/if}

<article>
  <h1 class="font-serif text-4xl font-bold">
    {user.name}
  </h1>
  {#if user.aboutMe}
    <Markdown markup={user.aboutMe.toString()} />
  {/if}
</article>

<div id="list-top" class="gap-y-m flex flex-col">
  <!-- Navigator -->
  {#if routes.length > 1}
    <nav class="gap-x-m flex">
      {#each routes as { route, title, current }}
        <a href={route} class={`hover:text-accent ${current && 'text-accent border-accent border-b-2'}`}>
          <h5 class="font-serif font-bold">{title}</h5>
        </a>
      {/each}
    </nav>
  {:else}
    <h5 class="font-serif font-bold">{routes[0].title}</h5>
  {/if}
  <!-- List Content -->
  {#if listData.tab === 'articles'}
    {#if listData.articles.count === 0}
      <p class="text-subtle">暂无文章</p>
    {:else}
      <ArticleList articles={listData.articles} {pageLink} />
    {/if}
  {:else if listData.tab === 'comments'}
    {#if listData.comments.count === 0}
      <p class="text-subtle">暂无评论</p>
    {:else}
      <CommentList comments={listData.comments} {pageLink} />
    {/if}
  {/if}
</div>
