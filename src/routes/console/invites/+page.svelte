<script lang="ts">
  import Button from '$lib/component/Button.svelte';
  import UserBadge from '$lib/component/UserBadge.svelte';
  import { format } from 'date-fns';
  import DeleteIcon from '~icons/material-symbols-light/delete-outline';
  import CopyIcon from '~icons/material-symbols-light/content-copy-outline-rounded';

  const { data } = $props();
  const { quota, relations, unusedCodes } = $derived(data);
  const { invitees, inviter } = $derived(relations);
  let copied = $state('');
</script>

<p>
  每发表一篇文章可以邀请 1 位作者，
  {#if quota > 0}
    你还可以邀请 {quota} 位作者。
  {:else}
    继续发表文章增加名额。
  {/if}
</p>
<p>
  {#if inviter}
    你受 <UserBadge {...inviter} /> 邀请成为作者。
  {:else}
    您是尊贵的原始用户。
  {/if}
</p>

<div class="gap-y-s flex flex-col">
  <h5 class="font-semibold">邀请码</h5>
  {#if unusedCodes.length > 0}
    <div class="grid-codes gap-x-xs gap-y-xs grid items-center">
      {#each unusedCodes as { code }}
        <p class="text-accent font-mono">{code}</p>
        <form action="?/delete" method="POST">
          <input type="hidden" name="code" value={code} />
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
    <form action="?/create" method="POST">
      <Button type="submit">创建邀请码({quota})</Button>
    </form>
  {/if}
</div>

{#if invitees.length > 0}
  <div>
    <h5 class="font-semibold">已邀请作者</h5>
    <div class="grid-invitees gap-x-xs gap-y-2xs grid">
      {#each invitees as { name, username, invitedAt }}
        <UserBadge {name} {username} />
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
