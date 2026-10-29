<script lang="ts">
  import { page } from '$app/state';
  import Button from '$lib/component/Button.svelte';
  import { loadPageData, simulateTestingLogin } from './page.remote';

  const nextParam = $derived(page.url.searchParams.get('next') || '/');
  const safeNext = $derived(nextParam.startsWith('/') ? nextParam : '/');

  const { users } = $derived(await loadPageData());
</script>

<svelte:head>
  <title>模拟登录 - EXODUS</title>
  <meta property="og:title" content="模拟登录 - EXODUS" />
</svelte:head>

<p class="font-serif text-2xl font-bold">模拟登录</p>
<p class="text-muted mt-2">仅供开发与测试环境使用</p>
<form {...simulateTestingLogin} class="gap-y-2xs mt-m flex flex-col sm:max-w-[60%]">
  <input {...simulateTestingLogin.fields.next.as('hidden', safeNext)} />
  {#each users as user (user.id)}
    <Button variant="normal" {...simulateTestingLogin.fields.userId.as('submit', user.id)}>
      {user.name} (@{user.username}) {user.roles.length ? user.roles.join(', ') : 'no_role'}
    </Button>
  {/each}
</form>
