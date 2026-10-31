<script lang="ts">
  import Input from '#lib/component/Input.svelte';
  import Button from '#lib/component/Button.svelte';
  import { acceptInviteCode } from './page.remote';
</script>

<p>本站作者采用熟人邀请制，请联系认识的作者获取邀请码，成为作者。</p>
<form class="flex flex-col gap-y-3" {...acceptInviteCode}>
  <Input
    {...acceptInviteCode.fields.inviteCode.as('text')}
    label="邀请码"
    issues={acceptInviteCode.fields.inviteCode.issues()}
    required
  />
  <Button pending={acceptInviteCode.pending} type="submit">成为作者</Button>
</form>
