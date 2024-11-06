<script lang="ts">
  import { createDialog, melt } from '@melt-ui/svelte';
  import { enhance } from '$app/forms';
  import Button from '$lib/component/Button.svelte';
  import Input from '$lib/component/Input.svelte';

  const { data } = $props();
  const { user } = data;
  const {
    elements: { trigger, portalled, overlay, content, title, description, close },
    states: { open },
  } = createDialog({ role: 'alertdialog' });
</script>

<svelte:head>
  <title>账户设置 - Exodus</title>
  <meta property="og:title" content="账户设置" />
</svelte:head>

<div id="account-setting" class="items-center gap-x-m">
  <p class="font-bold font-serif">用户名:</p>
  <p>{user.username}</p>
  <div use:melt={$trigger}>
    <Button>编辑</Button>
  </div>
  <p class="font-bold font-serif">GitHub ID:</p>
  <p>{user.githubId}</p>
</div>

{#if $open}
  <div use:melt={$portalled}>
    <div class="fixed top-0 left-0 w-full h-full z-40 bg-muted/20" use:melt={$overlay}></div>
    <div class="dialog bg-surface z-50 px-l py-m flex flex-col gap-y-m" use:melt={$content}>
      <div>
        <h2 class="font-serif font-bold" use:melt={$title}>修改用户名</h2>
        <p class="text-warn" use:melt={$description}>
          用户名更改后，个人主页地址也变更，请谨慎修改。
        </p>
      </div>
      <form class="flex flex-col gap-y-m" method="POST" use:enhance>
        <Input type="text" field="username" label="用户名" value={user.username} required />
        <div class="flex flex-row gap-x-m">
          <div class="flex-1" use:melt={$close}><Button type="button">取消</Button></div>
          <div class="flex-1"><Button variant="danger" type="submit">提交</Button></div>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  #account-setting {
    display: grid;
    grid-template-columns: max-content max-content max-content;
    grid-template-rows: auto auto;
  }
  div.dialog {
    position: fixed;
    width: 80%;
    max-width: 30rem;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
  }
</style>
