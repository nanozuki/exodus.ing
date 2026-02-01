<script lang="ts">
  import { page } from '$app/state';
  import Button from '$lib/component/Button.svelte';
  import { FormState } from '$lib/rune/FormState.svelte';
  import { listTestingUsers, simulateTestingLogin } from '$remotes/testing.remote';

  const nextParam = $derived(page.url.searchParams.get('next') || '/');
  const safeNext = $derived(nextParam.startsWith('/') ? nextParam : '/');
  const { users } = $derived(await listTestingUsers());
  const loginForm = new FormState(simulateTestingLogin);
</script>

<svelte:head>
  <title>模拟登录 - EXODUS</title>
  <meta property="og:title" content="模拟登录 - EXODUS" />
</svelte:head>

<p class="font-serif text-2xl font-bold">模拟登录</p>
<p class="text-muted mt-2">仅供开发与测试环境使用</p>
<form {...loginForm.props} class="gap-y-2xs mt-m flex flex-col sm:max-w-[60%]">
  <input type="hidden" name="next" value={safeNext} />
  {#if loginForm.error}
    <p class="text-error">{loginForm.error}</p>
  {/if}
  {#each users as user}
    <Button variant="normal" type="submit" name="userId" value={user.id}>
      {user.name} (@{user.username}) {user.roles.length ? user.roles.join(', ') : 'no_role'}
    </Button>
  {/each}
</form>
