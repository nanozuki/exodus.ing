<script lang="ts">
  import { createDialog, melt } from '@melt-ui/svelte';

  const { data } = $props();
  const { user } = data;
  const {
    elements: { trigger, portalled, overlay, content, title, description, close },
    states: { open },
  } = createDialog({ role: 'alertdialog' });
</script>

<h4>账户</h4>
<div id="account-setting">
  <p class="label">用户名:</p>
  <p class="value">{user.username}</p>
  <button use:melt={$trigger}>编辑</button>
  <p class="label">GitHub ID:</p>
  <p class="value">{user.githubId}</p>
</div>

{#if $open}
  <div use:melt={$portalled}>
    <div class="overlay" use:melt={$overlay}></div>
    <div class="dialog" use:melt={$content}>
      <h2 class="design" use:melt={$title}>修改用户名</h2>
      <p class="warn" use:melt={$description}>用户名更改后，个人主页地址也变更，请谨慎修改。</p>
      <form method="POST" action="?/username">
        <input type="text" name="username" value={user.username} required />
        <div class="actions">
          <button class="negative" type="button" use:melt={$close}>取消</button>
          <button class="positive" type="submit">提交</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  #account-setting {
    display: grid;
    grid-template-columns: max-content max-content max-content;
    column-gap: 1rem;
  }
  .label {
    font-weight: bold;
    font-family: var(--serif);
    font-weight: bold;
  }
  button {
    padding-top: 0;
    padding-bottom: 0;
    align-self: start;
  }
  div.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 50;
    background-color: rgba(0, 0, 0, 0.5);
  }
  div.dialog {
    background-color: var(--secondary-bg);
    position: fixed;
    z-index: 50;
    width: 80%;
    max-width: 20rem;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
    padding: 1rem;
  }
  p.warn {
    color: var(--red);
  }
  input {
    width: 100%;
  }
  div.actions {
    display: flex;
    column-gap: 1rem;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    button {
      flex: 1;
    }
  }
</style>
