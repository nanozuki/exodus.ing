<script lang="ts">
  import { page } from '$app/state';
  import Button from '$lib/component/Button.svelte';
  import ButtonLink from '$lib/component/ButtonLink.svelte';
  import Input from '$lib/component/Input.svelte';
  import { FormState } from '$lib/rune/FormState.svelte';
  import { loginByGithub, registerByGithub } from '$remotes/auth.remote';

  let next = $derived(page.url.searchParams.get('next') || undefined);
  let username = $state('');
  let name = $state('');
  const registerForm = new FormState(registerByGithub);
  const loginForm = new FormState(loginByGithub);
</script>

<svelte:head>
  <title>EXODUS</title>
  <meta property="og:title" content="EXODUS" />
</svelte:head>

<p class="font-serif text-2xl font-bold">注册</p>
<form {...registerForm.props} class="gap-y-m flex flex-col sm:max-w-[60%]">
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
    {#if registerForm.error}<p class="text-error">{registerForm.error}</p>{/if}
    <Button variant="primary" pending={registerByGithub.pending} id="register" type="submit">使用 GitHub 注册</Button>
  </div>
</form>

<div class="border-border border-t"></div>

<p class="font-serif text-2xl font-bold">登录</p>
<form {...loginForm.props} class="gap-y-m flex flex-col sm:max-w-[60%]">
  <input type="hidden" name="next" value={next || ''} />
  {#if loginForm.error}<p class="text-error">{loginForm.error}</p>{/if}
  <Button variant="primary" pending={loginByGithub.pending} id="login" type="submit">使用 GitHub 登录</Button>
  {#if !import.meta.env.PROD}
    <ButtonLink class="text-center" variant="normal" href={`/auth/testing?next=${next || ''}`}>模拟登录</ButtonLink>
  {/if}
</form>
