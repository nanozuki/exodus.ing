<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/component/Button.svelte';
  import type { SubmitFunction } from './$types.js';

  let { data } = $props();
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
  <title>EXODUS</title>
  <meta property="og:title" content="EXODUS" />
</svelte:head>

<p class="font-serif text-2xl font-bold">登录 / 注册</p>
<form class="gap-y-m flex flex-col sm:max-w-[60%]" action="?/auth" method="POST" use:enhance={withSubmitting}>
  <input type="hidden" name="next" value={next} />
  <p class="text-subtle">使用 GitHub 账号登录或注册。如果您是新用户，将引导您完成注册。</p>
  <Button variant="primary" disabled={submitting} id="auth" type="submit">使用 GitHub 登录 / 注册</Button>
</form>
