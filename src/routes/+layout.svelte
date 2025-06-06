<script lang="ts">
  import '../app.css';

  import { navigating, page } from '$app/state';
  import Logo from '$lib/component/Logo.svelte';
  import Loading from '$lib/component/Loading.svelte';
  import UserBadge from '$lib/component/UserBadge.svelte';

  let { children, data } = $props();
  let { user } = $derived(data);
  let current = $derived.by(() => {
    let url = page.url;
    return encodeURIComponent(url.toString().replace(`${url.protocol}//${url.host}`, ''));
  });
</script>

<!-- web fonts -->
<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link
    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Serif:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Noto+Sans+SC:wght@100..900&family=Noto+Serif+SC:wght@200..900&family=Sofia+Sans+Extra+Condensed:ital,wght@0,1..1000;1,1..1000&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="max-w-article mx-page-horizontal gap-y-l page:mx-auto flex min-h-svh flex-col">
  <header class="py-xs flex flex-row items-center justify-between">
    <a href="/" class="gap-x-xs flex flex-row items-center">
      <Logo --size="var(--spacing-xl)" />
      <p id="site-name" class="font-title text-4xl font-bold">EXODUS</p>
      {#if navigating.type}
        <Loading --size="calc(var(--spacing) * 6)" />
      {/if}
    </a>
    {#if user}
      <UserBadge name={user.name} username={user.username} />
    {:else}
      <a class="text-accent" href={`/auth?next=${current}`}>注册/登录</a>
    {/if}
  </header>

  <main class="gap-y-l pb-l flex flex-1 flex-col">
    {@render children()}
  </main>
</div>

<style lang="postcss">
  :global(html) {
    color: var(--color-text);
    background-color: var(--color-base);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    overflow-y: scroll;
    scrollbar-color: var(--color-border) var(--color-surface);
  }
  :global(*) {
    text-autospace: normal;
  }
  :global(*:focus-visible) {
    outline: 0.125rem solid var(--color-focus-visible);
  }
  :global(h1) {
    font-size: var(--text-4xl);
  }
  :global(h2) {
    font-size: var(--text-3xl);
  }
  :global(h3) {
    font-size: var(--text-2xl);
  }
  :global(h4) {
    font-size: var(--text-xl);
  }
  :global(h5) {
    font-size: var(--text-lg);
  }
  #site-name {
    translate: 0 2.5%;
  }
</style>
