<script lang="ts">
  import Input from '$lib/component/Input.svelte';
  import Button from '$lib/component/Button.svelte';
  import { enhance } from '$app/forms';

  let { form } = $props();
</script>

<p>本站作者采用熟人邀请制，请联系认识的作者获取邀请码，成为作者。</p>
<form method="post" use:enhance class="flex flex-col gap-y-3">
  <Input field="inviteCode" label="邀请码" error={form?.error} required />
  <Button type="submit">成为作者</Button>
</form>
