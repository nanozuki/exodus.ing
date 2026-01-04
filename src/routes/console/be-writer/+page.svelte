<script lang="ts">
  import Input from '$lib/component/Input.svelte';
  import Button from '$lib/component/Button.svelte';
  import { acceptInviteCode } from '$remotes/invite_codes.remote';
  import { catchError } from '$lib/errors';

  let formError = $state<string | null>(null);
</script>

<p>本站作者采用熟人邀请制，请联系认识的作者获取邀请码，成为作者。</p>
<form
  class="flex flex-col gap-y-3"
  {...acceptInviteCode.enhance(async ({ form, submit }) => {
    formError = null;
    try {
      await submit();
      form.reset();
    } catch (e) {
      formError = catchError(e).message;
    }
  })}
>
  <Input
    name="inviteCode"
    label="邀请码"
    issues={acceptInviteCode.fields.inviteCode.issues()}
    error={formError || undefined}
    required
  />
  <Button pending={acceptInviteCode.pending} type="submit">成为作者</Button>
</form>
