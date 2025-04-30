<script lang="ts">
  import { page } from '$app/state';

  const { children } = $props();
  const pages = [
    { path: '/settings/profile', title: '个人资料' },
    { path: '/settings/account', title: '账户' },
    { path: '/settings/domains', title: '域名' },
  ];
</script>

<h4 class="font-serif font-bold">设置</h4>

<nav class="gap-x-m flex">
  {#each pages as { path, title }}
    <a href={path} class={`hover:text-accent ${path === page.url.pathname && 'text-accent border-accent border-b-2'}`}>
      <h5 class="font-serif font-bold">{title}</h5>
    </a>
  {/each}
</nav>

{@render children()}
