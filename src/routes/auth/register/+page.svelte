<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/component/Button.svelte';
  import Input from '$lib/component/Input.svelte';
  import type { SubmitFunction } from './$types.js';

  let { data, form } = $props();
  let { next } = $derived(data);
  let submitting = $state(false);
  const withSubmitting: SubmitFunction = () => {
    submitting = true;
    return async ({ update }) => {
      update();
      submitting = false;
    };
  };
</script>

<svelte:head>
  <title>完成注册 - EXODUS</title>
  <meta property="og:title" content="完成注册 - EXODUS" />
</svelte:head>

<p class="font-serif text-2xl font-bold">完成注册</p>
<p class="text-subtle">您的 GitHub 账号尚未注册，请填写以下信息完成注册。</p>
<form class="gap-y-m flex flex-col sm:max-w-[60%]" method="POST" use:enhance={withSubmitting}>
  <input type="hidden" name="next" value={next} />
  <Input
    name="username"
    label="用户名（可选）"
    type="text"
    description="账户唯一 ID，默认使用 GitHub 用户名"
    value={form?.username || ''}
  />
  <Input name="name" label="昵称（可选）" type="text" description="默认使用用户名" value={form?.name || ''} />
  <div class="gap-y-2xs flex flex-col">
    {#if form?.error}<p class="text-error">{form.error}</p>{/if}
    <Button variant="primary" disabled={submitting} id="register" type="submit">完成注册</Button>
  </div>
</form>
