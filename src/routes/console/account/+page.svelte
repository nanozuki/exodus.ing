<script lang="ts">
  import { page } from '$app/state';
  import { loadLayoutData } from '../layout.remote';
  import Button from '#lib/component/Button.svelte';
  import Input from '#lib/component/Input.svelte';
  import Dialog from '#lib/component/Dialog.svelte';
  import { updateUsername } from './page.remote';

  const { user } = $derived(await loadLayoutData({ pathname: page.url.pathname }));
  let hasMountedUsernameForm = false;

  function resetUsernameOnRemount(form: HTMLFormElement) {
    // Keep initial native-submission feedback; later mounts discard the closed dialog's edits and issues.
    if (hasMountedUsernameForm) form.reset();
    hasMountedUsernameForm = true;
  }
</script>

<svelte:head>
  <title>账户设置 - Exodus</title>
  <meta property="og:title" content="账户设置" />
</svelte:head>

<div id="account-setting" class="gap-x-m items-center">
  <p class="font-serif font-bold">用户名:</p>
  <p>{user.username}</p>
  <Dialog labelledby="username-dialog-title">
    {#snippet trigger()}
      编辑
    {/snippet}
    {#snippet content(close)}
      <div>
        <h2 id="username-dialog-title" class="font-serif font-bold">修改用户名</h2>
        <p class="text-warn">用户名更改后，个人主页地址也变更，请谨慎修改。</p>
      </div>
      <form class="gap-y-m flex flex-col" {...updateUsername} {@attach resetUsernameOnRemount}>
        <Input
          {...updateUsername.fields.username.as('text', user.username)}
          label="用户名"
          issues={updateUsername.fields.username.issues()}
          required
        />
        <div class="gap-x-m flex flex-row">
          <div class="flex-1">
            <Button type="button" onclick={close}>取消</Button>
          </div>
          <div class="flex-1">
            <Button variant="danger" pending={updateUsername.pending} type="submit">提交</Button>
          </div>
        </div>
      </form>
    {/snippet}
  </Dialog>
  <p class="font-serif font-bold">GitHub ID:</p>
  <p>{user.githubId}</p>
</div>

<style>
  #account-setting {
    display: grid;
    grid-template-columns: max-content max-content max-content;
    grid-template-rows: auto auto;
  }
</style>
