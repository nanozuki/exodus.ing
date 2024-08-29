<script lang="ts">
  import { enhance } from '$app/forms';
  let inviteCode = $state('');
  let { form } = $props();
</script>

<svelte:head>
  <title>EXODUS</title>
  <meta property="og:title" content="EXODUS" />
</svelte:head>

<h2>注册</h2>
<p class:error={form?.error.inviteCode}>{form?.error.inviteCode || '获得邀请方可注册。'}</p>
<form id="register" method="POST" action="?/register" use:enhance>
  <label for="inviteCode">邀请码</label>
  <input name="inviteCode" type="text" bind:value={inviteCode} required />
  <button id="register" class="positive" type="submit">使用 GitHub 注册</button>
</form>

<div class="separator"></div>

<h2>登录</h2>
<form id="login" method="POST" action="?/login">
  <button id="login" class="positive" type="submit">使用 GitHub 登录</button>
</form>

<style>
  div.separator {
    margin: 1rem 0;
    border-top: 1px solid var(--border-color);
  }
  p.error {
    color: var(--red);
  }
  form#register {
    display: grid;
    grid-template:
      'label input' auto
      'submit submit' auto / auto 1fr;
    gap: 1rem 0.5rem;
    align-items: center;
  }
  form#register label {
    grid-area: label;
  }
  form#register input {
    grid-area: input;
  }
  form#register button {
    grid-area: submit;
  }
  form button {
    width: 100%;
    background-color: var(--primary-fg);
  }
  @media (min-width: 43rem) {
    form {
      max-width: 20rem;
    }
  }
</style>
