<script lang="ts">
  import { page } from '$app/state';
  import Button from '#lib/component/Button.svelte';
  import ButtonLink from '#lib/component/ButtonLink.svelte';
  import Input from '#lib/component/Input.svelte';
  import { loginByGithub, registerByGithub } from './page.remote';

  let next = $derived(page.url.searchParams.get('next') || undefined);
</script>

<svelte:head>
  <title>EXODUS</title>
  <meta property="og:title" content="EXODUS" />
</svelte:head>

<p class="font-serif text-2xl font-bold">注册</p>
<form {...registerByGithub} class="gap-y-m flex flex-col sm:max-w-[60%]">
  <input {...registerByGithub.fields.next.as('hidden', next || '')} />
  <Input
    {...registerByGithub.fields.username.as('text')}
    label="用户名（可选）"
    description="账户唯一 ID，默认使用 GitHub 用户名"
    issues={registerByGithub.fields.username.issues()}
  />
  <Input
    {...registerByGithub.fields.name.as('text')}
    label="昵称（可选）"
    description="默认使用用户名"
    issues={registerByGithub.fields.name.issues()}
  />
  <div class="gap-y-2xs flex flex-col">
    <Button variant="primary" pending={registerByGithub.pending} id="register" type="submit">使用 GitHub 注册</Button>
  </div>
</form>

<div class="border-border border-t"></div>

<p class="font-serif text-2xl font-bold">登录</p>
<form {...loginByGithub} class="gap-y-m flex flex-col sm:max-w-[60%]">
  <input {...loginByGithub.fields.next.as('hidden', next || '')} />
  <Button variant="primary" pending={loginByGithub.pending} id="login" type="submit">使用 GitHub 登录</Button>
  {#if !import.meta.env.PROD}
    <ButtonLink class="text-center" variant="normal" href={`/auth/testing?next=${next || ''}`}>模拟登录</ButtonLink>
  {/if}
</form>
