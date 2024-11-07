<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/component/Button.svelte';
  import Input from '$lib/component/Input.svelte';
  import Dialog from '$lib/component/Dialog.svelte';

  const { data } = $props();
  const { user } = data;
  let open = $state(false);
  let openDialog = () => {
    open = true;
  };
  let closeDialog = () => {
    open = false;
  };
</script>

<svelte:head>
  <title>账户设置 - Exodus</title>
  <meta property="og:title" content="账户设置" />
</svelte:head>

<div id="account-setting" class="items-center gap-x-m">
  <p class="font-bold font-serif">用户名:</p>
  <p>{user.username}</p>
  <Dialog bind:open>
    {#snippet trigger()}
      <Button onclick={openDialog}>编辑</Button>
    {/snippet}
    {#snippet content()}
      <div>
        <h2 class="font-serif font-bold">修改用户名</h2>
        <p class="text-warn">用户名更改后，个人主页地址也变更，请谨慎修改。</p>
      </div>
      <form class="flex flex-col gap-y-m" method="POST" use:enhance>
        <Input type="text" field="username" label="用户名" value={user.username} required />
        <div class="flex flex-row gap-x-m">
          <div class="flex-1">
            <Button type="button" onclick={closeDialog}>取消</Button>
          </div>
          <div class="flex-1"><Button variant="danger" type="submit">提交</Button></div>
        </div>
      </form>
    {/snippet}
  </Dialog>
  <p class="font-bold font-serif">GitHub ID:</p>
  <p>{user.githubId}</p>
</div>

<style>
  #account-setting {
    display: grid;
    grid-template-columns: max-content max-content max-content;
    grid-template-rows: auto auto;
  }
</style>
