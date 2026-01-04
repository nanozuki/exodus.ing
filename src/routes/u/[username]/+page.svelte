<script lang="ts">
  import { page } from '$app/state';
  import AddIcon from '~icons/mdi/add';
  import MdiLogout from '~icons/mdi/logout';
  import ArticleList from '$lib/component/ArticleList.svelte';
  import CommentList from '$lib/component/CommentList.svelte';
  import Markdown from '$lib/component/Markdown.svelte';
  import SettingIcon from '~icons/mdi/settings-outline';
  import { getUserPageData } from '$remotes/users.remote';
  import Action from '$lib/component/Action.svelte';
  import { logout } from '$remotes/auth.remote.js';

  const { params } = $props();
  const username = $derived(params.username);
  const currentPage = $derived(Math.max(1, parseInt(page.url.searchParams.get('page') || '1', 10) || 1));
  const currentTab = $derived(page.url.searchParams.get('tab') || undefined);
  const pageData = $derived(await getUserPageData({ username, page: currentPage, tab: currentTab }));
  let { user, listData, isMyself, isWriter } = $derived(pageData);
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
    <form {...logout}>
      <Action element="button" type="submit" class="bg-error/20 text-error">
        <span>登出</span>
        <MdiLogout />
      </Action>
    </form>
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
