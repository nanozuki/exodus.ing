<!--
  @component
  Completes or cancels a pending sign-up, with the form prefilled from `loadPageData`. Field issues show beside their
  inputs; other submission errors go to the error page.

  - `submitSignUp` form: `Input` username, `Input` display name, submit `Button`
  - `cancelSignUp` form: cancel `Button`
-->
<script lang="ts">
  import { refreshAll } from '$app/navigation';
  import Button from '#lib/component/Button.svelte';
  import Input from '#lib/component/Input.svelte';
  import { cancelSignUp, loadPageData, submitSignUp } from './page.remote';

  const prefill = $derived(await loadPageData());

  // Both forms end the pending sign-up, after which `loadPageData` redirects. The default post-submit refresh resets
  // and reruns it while this page is still mounted, so take over updates and refresh only once the redirect has
  // navigated away; completing changes the viewer, so the new page's queries must reload.
  const signUp = submitSignUp.enhance(async ({ submit }) => {
    if (await submit().updates()) await refreshAll();
  });
  const cancel = cancelSignUp.enhance(async ({ submit }) => {
    await submit().updates();
  });
</script>

<svelte:head>
  <title>注册 - EXODUS</title>
  <meta property="og:title" content="注册" />
</svelte:head>

<p class="font-serif text-2xl font-bold">注册</p>
<form {...signUp} class="gap-y-m flex flex-col sm:max-w-[60%]">
  <Input
    {...submitSignUp.fields.username.as('text', prefill.username)}
    label="用户名"
    description="账户唯一 ID，也是个人主页地址"
    issues={submitSignUp.fields.username.issues()}
    required
  />
  <Input
    {...submitSignUp.fields.name.as('text', prefill.name)}
    label="昵称"
    issues={submitSignUp.fields.name.issues()}
    required
  />
  <Button variant="primary" pending={submitSignUp.pending} type="submit">注册</Button>
</form>
<form {...cancel} class="flex flex-col sm:max-w-[60%]">
  <Button variant="normal" pending={cancelSignUp.pending} type="submit">取消</Button>
</form>
