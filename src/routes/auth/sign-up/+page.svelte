<!--
  @component
  Completes or cancels a pending sign-up, with the form prefilled from `loadPageData`. Field issues show beside their
  inputs; other submission errors go to the error page.

  - `submitSignUp` form: `Input` username, `Input` display name, submit `Button`
  - `cancelSignUp` form: cancel `Button`
-->
<script lang="ts">
  import Button from '#lib/component/Button.svelte';
  import Input from '#lib/component/Input.svelte';
  import { cancelSignUp, loadPageData, submitSignUp } from './page.remote';

  const prefill = $derived(await loadPageData());

  // Cancelling ends the pending sign-up, after which `loadPageData` redirects; the default post-submit refresh would
  // rerun it, so take over updates. `submitSignUp` sets the viewer on the server, which skips that refresh itself.
  const cancel = cancelSignUp.enhance(async ({ submit }) => {
    await submit().updates();
  });
</script>

<svelte:head>
  <title>注册 - EXODUS</title>
  <meta property="og:title" content="注册" />
</svelte:head>

<p class="font-serif text-2xl font-bold">注册</p>
<form {...submitSignUp} class="gap-y-m flex flex-col sm:max-w-[60%]">
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
