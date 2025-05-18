<script lang="ts">
  import { page } from '$app/state';
  import { consoleAllRoutes } from './routes';

  const { children } = $props();
</script>

<h4 class="font-serif font-bold">控制台</h4>

<nav class="gap-x-m flex">
  {#each consoleAllRoutes as { route, title }}
    <a
      href={route}
      class={`hover:text-accent ${route === page.url.pathname && 'text-accent border-accent border-b-2'}`}
    >
      <h5 class="font-serif font-bold">{title}</h5>
    </a>
  {/each}
</nav>

{@render children()}
