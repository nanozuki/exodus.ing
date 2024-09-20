<script lang="ts">
  import { page } from '$app/stores';

  const { children } = $props();
  const pages = [
    { path: '/settings/profile', title: '个人资料' },
    { path: '/settings/account', title: '账户' },
    { path: '/settings/domains', title: '域名' },
  ];
</script>

<h3>设置</h3>

<nav>
  {#each pages as { path, title }}
    <a href={path} class:current={path === $page.url.pathname}>
      <h4 class="design">{title}</h4>
    </a>
  {/each}
</nav>

{@render children()}

<style>
  nav {
    display: flex;
    column-gap: 1rem;
    margin-bottom: 1.5rem;
  }
  a {
    color: var(--primary-fg);
    text-decoration: none;
  }
  a:visited {
    color: var(--primary-fg);
  }
  a:hover {
    color: var(--red);
  }
  a.current {
    color: var(--red);
    border-bottom: 0.125rem solid var(--red);
  }
</style>
