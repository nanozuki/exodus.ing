<script lang="ts">
  import { page } from '$app/state';
  import Button from '$lib/component/Button.svelte';
  import Input from '$lib/component/Input.svelte';
  import { catchError } from '$lib/errors';
  import { loginByGithub, registerByGithub } from '$remotes/auth.remote';

  let next = $derived(page.url.searchParams.get('next') || undefined);
  let username = $state('');
  let name = $state('');
  let registerError = $state<string | null>(null);
  let loginError = $state<string | null>(null);
</script>

<svelte:head>
  <title>EXODUS</title>
  <meta property="og:title" content="EXODUS" />
</svelte:head>

<p class="font-serif text-2xl font-bold">注册</p>
<form
  {...registerByGithub.enhance(async ({ submit }) => {
    registerError = null;
    try {
      await submit();
    } catch (e) {
      const err = catchError(e);
      registerError = err.message;
    }
  })}
  class="gap-y-m flex flex-col sm:max-w-[60%]"
>
  <input type="hidden" name="next" value={next || ''} />
  <Input
    name="username"
    label="用户名（可选）"
    type="text"
    description="账户唯一 ID，默认使用 GitHub 用户名"
    issues={registerByGithub.fields.username.issues()}
    bind:value={username}
  />
  <Input
    name="name"
    label="昵称（可选）"
    type="text"
    description="默认使用用户名"
    issues={registerByGithub.fields.name.issues()}
    bind:value={name}
  />
  <div class="gap-y-2xs flex flex-col">
    {#if registerError}<p class="text-error">{registerError}</p>{/if}
    <Button variant="primary" pending={registerByGithub.pending} id="register" type="submit">使用 GitHub 注册</Button>
  </div>
</form>

<div class="border-border border-t"></div>

<p class="font-serif text-2xl font-bold">登录</p>
<form
  {...loginByGithub.enhance(async ({ submit }) => {
    loginError = null;
    try {
      await submit();
    } catch (e) {
      const err = catchError(e);
      loginError = err.message;
    }
  })}
  class="gap-y-m flex flex-col sm:max-w-[60%]"
>
  <input type="hidden" name="next" value={next || ''} />
  {#if loginError}<p class="text-error">{loginError}</p>{/if}
  <Button variant="primary" pending={loginByGithub.pending} id="login" type="submit">使用 GitHub 登录</Button>
</form>
