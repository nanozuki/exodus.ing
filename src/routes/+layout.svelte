<script lang="ts">
  import { navigating } from '$app/stores';
  import Logo from '$lib/component/Logo.svelte';
  import Loading from '$lib/component/Loading.svelte';
  import './styles.css';

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

<header>
  {#if $navigating}<Loading />{:else}<Logo />{/if}
  <a class="design" href="/"><h1 class="design">EXODUS</h1></a>
  <div style="flex: 1"></div>
  {#if data.user}
    <a href={`/u/${data.user.username}`}>{data.user.name}</a>
  {:else}
    <a href="/auth">注册/登录</a>
  {/if}
</header>

<main>
  {@render children()}
</main>

<style>
  header,
  main {
    max-width: 40rem;
    margin: 0 1.5rem;
  }
  @media (min-width: 43rem) {
    header,
    main {
      margin: 0 auto;
    }
  }
  header {
    display: flex;
    align-items: center;
    column-gap: 0.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
</style>
