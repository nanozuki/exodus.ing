<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/component/Button.svelte';
  import Input from '$lib/component/Input.svelte';
  import type { SubmitFunction } from './$types.js';

  let { data, form } = $props();
  let { next } = $derived(data);
  let submitting = $state(false);
  let variant = $derived<'disabled' | 'primary'>(submitting ? 'disabled' : 'primary');
  const withSubmitting: SubmitFunction = () => {
    submitting = true;
    return async ({ update }) => {
      update();
      submitting = false;
    };
  };
</script>

<svelte:head>
  <title>EXODUS</title>
  <meta property="og:title" content="EXODUS" />
</svelte:head>

<p class="font-serif text-2xl font-bold">注册</p>
<form class="gap-y-m flex flex-col sm:max-w-[60%]" action="?/register" method="POST" use:enhance={withSubmitting}>
  <input type="hidden" name="next" value={next} />
  <Input
    field="username"
    label="用户名（可选）"
    type="text"
    description="账户唯一 ID，默认使用 GitHub 用户名"
    value={form?.username || ''}
  />
  <Input field="name" label="昵称（可选）" type="text" description="默认使用用户名" value={form?.name || ''} />
  <div class="gap-y-2xs flex flex-col">
    {#if form?.error}<p class="text-error">{form.error}</p>{/if}
    <Button {variant} id="register" class="positive" type="submit">使用 GitHub 注册</Button>
  </div>
</form>

<div class="border-border border-t"></div>

<p class="font-serif text-2xl font-bold">登录</p>
<form class="gap-y-m flex flex-col sm:max-w-[60%]" action="?/login" method="POST" use:enhance={withSubmitting}>
  <input type="hidden" name="next" value={next} />
  <Button {variant} id="login" type="submit">使用 GitHub 登录</Button>
</form>
