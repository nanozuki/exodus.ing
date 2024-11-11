<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/component/Button.svelte';
  import Input from '$lib/component/Input.svelte';

  let { data, form } = $props();
  let { next } = $derived(data);
  let submitting = $state(false);
  const preSubmit = () => {
    submitting = true;
  };
</script>

<svelte:head>
  <title>EXODUS</title>
  <meta property="og:title" content="EXODUS" />
</svelte:head>

<p class="font-serif font-bold text-2xl">注册</p>
<form class="flex flex-col gap-y-m" id="register" method="POST" action="?/register" use:enhance={preSubmit}>
  <p class:error={form?.error.inviteCode}>{form?.error.inviteCode || '获得邀请方可注册。'}</p>
  <input type="hidden" name="next" value={next} />
  <Input field="inviteCode" label="邀请码" type="text" required />
  <Button variant={submitting ? 'disabled' : 'primary'} id="register" class="positive" type="submit"
    >使用 GitHub 注册</Button
  >
</form>

<div class="border-t border-border"></div>

<p class="font-serif font-bold text-2xl">登录</p>
<form class="flex flex-col gap-y-m" id="login" method="POST" action="?/login" use:enhance={preSubmit}>
  <input type="hidden" name="next" value={next} />
  <Button variant={submitting ? 'disabled' : 'primary'} id="login" type="submit">使用 GitHub 登录</Button>
</form>
