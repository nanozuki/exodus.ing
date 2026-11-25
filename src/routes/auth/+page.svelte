<!--
  @component
  Starts GitHub sign-in, submitting the optional `next` search parameter. Submission errors go to the error page. The
  simulated-login link appears only when `PROD` is false; the testing remote enforces its own environment check.

  - `loginByGithub` form: "sign in with GitHub" `Button`, simulated-login `ButtonLink`
-->
<script lang="ts">
  import { page } from '$app/state';
  import Button from '#lib/component/Button.svelte';
  import ButtonLink from '#lib/component/ButtonLink.svelte';
  import { loginByGithub } from './page.remote';

  let next = $derived(page.url.searchParams.get('next') || undefined);
</script>

<svelte:head>
  <title>EXODUS</title>
  <meta property="og:title" content="EXODUS" />
</svelte:head>

<p class="font-serif text-2xl font-bold">登录</p>
<form {...loginByGithub} class="gap-y-m flex flex-col sm:max-w-[60%]">
  <input {...loginByGithub.fields.next.as('hidden', next || '')} />
  <Button variant="primary" pending={loginByGithub.pending} id="login" type="submit">使用 GitHub 登录</Button>
  {#if !import.meta.env.PROD}
    <ButtonLink class="text-center" variant="normal" href={`/auth/testing?next=${next || ''}`}>模拟登录</ButtonLink>
  {/if}
</form>
