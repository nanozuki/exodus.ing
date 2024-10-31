<script lang="ts">
  import { navigating } from '$app/stores';
  import Logo from '$lib/component/Logo.svelte';
  import Loading from '$lib/component/Loading.svelte';
  import './vars.css';
  import './default.css';
  import './global.css';

  const { children, data } = $props();
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

<div class="page-container">
  <header>
    <a href="/" class="header-left">
      {#if $navigating}<Loading />{:else}<Logo --size="var(--space-l)" />{/if}
      <p>EXODUS</p>
    </a>
    {#if data.user}
      <a href={`/u/${data.user.username}`}>{data.user.name}</a>
    {:else}
      <a href="/auth">注册/登录</a>
    {/if}
  </header>

  <main>
    {@render children()}
  </main>

  <footer></footer>
</div>

<style>
  .page-container {
    max-width: var(--max-width-article);
    margin: 0 var(--space-page-horizontal);
    display: flex;
    flex-direction: column;
    row-gap: var(--space-l);
  }
  @media (min-width: 43em) {
    /* var(--max-width-article) + 2 * var(--page-horiz-margin) */
    .page-container {
      margin: 0 auto;
    }
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-xs) 0;
    p {
      font-size: var(--font-size-2xl);
      font-family: var(--font-serif);
      font-weight: var(--font-weight-bold);
    }
  }
  .header-left {
    display: flex;
    align-items: center;
    column-gap: var(--space-xs);
  }
  main {
    display: flex;
    flex-direction: column;
    row-gap: var(--space-l);
  }
  footer {
    height: var(--space-2xl);
  }
</style>
