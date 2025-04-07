<script lang="ts">
  import './app.css';

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
    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Serif:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Noto+Sans+SC:wght@100..900&family=Noto+Serif+SC:wght@200..900&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="max-w-article mx-page-horizontal flex flex-col gap-y-l sm:mx-auto min-h-svh">
  <header class="flex flex-row items-center justify-between py-xs">
    <a href="/" class="flex flex-row items-center gap-x-xs">
      {#if navigating.to}<Loading />{:else}<Logo --size="var(--space-l)" />{/if}
      <p class="text-2xl font-serif font-bold">EXODUS</p>
    </a>
    {#if user}
      <UserBadge name={user.name} username={user.username} />
    {:else}
      <a class="text-accent" href={`/auth?next=${current}`}>注册/登录</a>
    {/if}
  </header>

  <main class="flex flex-col gap-y-l pb-l flex-1">
    {@render children()}
  </main>
</div>

<style lang="postcss">
  :global(html) {
    color: var(--color-text);
    background-color: var(--color-base);
    font-family: var(--font-sans-serif);
    font-size: var(--text-base);
    line-height: var(--linehight-normal);
    overflow-y: scroll;
    scrollbar-color: var(--color-border) var(--color-surface);
  }
  :global(*:focus-visible) {
    outline: 0.125rem solid var(--color-focus-visible);
  }
  :global(h1) {
    font-size: var(--font-size-4xl);
  }
  :global(h2) {
    font-size: var(--font-size-3xl);
  }
  :global(h3) {
    font-size: var(--font-size-2xl);
  }
  :global(h4) {
    font-size: var(--font-size-xl);
  }
  :global(h5) {
    font-size: var(--font-size-l);
  }
</style>
