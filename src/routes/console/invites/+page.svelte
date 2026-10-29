<script lang="ts">
  import { page } from '$app/state';
  import Action from '#lib/component/Action.svelte';
  import Button from '#lib/component/Button.svelte';
  import CopyIcon from '~icons/material-symbols-light/content-copy-outline-rounded';
  import DeleteIcon from '~icons/material-symbols-light/delete-outline';
  import UserBadge from '#lib/component/UserBadge.svelte';
  import { format } from 'date-fns';
  import { createInviteCode, deleteInviteCode, loadPageData } from './page.remote';

  const welcome = $derived(page.url.searchParams.get('welcome') === 'true');

  const inviteData = $derived(await loadPageData({}));
  const { invitees, inviter, quota, unusedCodes } = $derived(inviteData);

  let copied = $state('');
</script>

<p>
  {#if inviter}
    {#if welcome}恭喜！邀请码验证通过！{/if}你受 <UserBadge user={inviter.user} /> 邀请成为作者。
  {:else}
    您通过站点直接邀请成为作者。
  {/if}
  每发表一篇文章可以邀请 1 位作者，
  {#if quota > 0}
    目前还可以再创建 {quota} 个邀请码。
  {:else}
    继续发表文章增加名额。
  {/if}
</p>

<div class="flex">
  <Action element="a" href="/a/new/edit">发表新文章</Action>
</div>

<div class="gap-y-s flex flex-col">
  <h5 class="font-semibold">邀请码</h5>
  {#if unusedCodes.length > 0}
    <div class="grid-codes gap-x-xs gap-y-xs grid items-center">
      {#each unusedCodes as { code } (code)}
        {@const deleteForm = deleteInviteCode.for(code)}
        <p class="text-accent font-mono">{code}</p>
        <form {...deleteForm}>
          <input {...deleteForm.fields.code.as('hidden', code)} />
          <button type="submit" class="text-error bg-error/20 hover:bg-error/30 block p-1">
            <DeleteIcon class="size-6" />
          </button>
        </form>
        <button
          class="bg-text/20 hover:bg-text/30 block p-1"
          onclick={async () => {
            await navigator.clipboard.writeText(code);
            copied = code;
          }}
        >
          <CopyIcon class="size-6" />
        </button>
        <p class="text-subtle">
          {#if copied === code}已复制！{/if}
        </p>
      {/each}
    </div>
  {:else}
    <p class="text-subtle">暂无邀请码</p>
  {/if}

  {#if quota > 0}
    <form {...createInviteCode}>
      <Button pending={createInviteCode.pending} type="submit">创建邀请码({quota})</Button>
    </form>
  {/if}
</div>

{#if invitees.length > 0}
  <div>
    <h5 class="font-semibold">已邀请作者</h5>
    <div class="grid-invitees gap-x-xs gap-y-2xs grid">
      {#each invitees as { user, invitedAt } (user.id)}
        <UserBadge {user} />
        {format(new Date(invitedAt), 'yyyy-MM-dd HH:mm')}
      {/each}
    </div>
  </div>
{/if}

<style>
  .grid-codes {
    grid-template-columns: repeat(4, max-content);
  }
  .grid-invitees {
    grid-template-columns: repeat(2, max-content);
  }
</style>
