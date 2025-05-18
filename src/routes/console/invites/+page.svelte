<script lang="ts">
  import Button from '$lib/component/Button.svelte';
  import UserBadge from '$lib/component/UserBadge.svelte';
  import type { InviteCode } from '$lib/domain/entities/invite_code';
  import { Role } from '$lib/domain/entities/role';
  import { format } from 'date-fns';

  const inviter = { name: 'Nanozuki', username: 'Nanozuki' };
  const invitee = $state([
    {
      name: 'Yakuky',
      username: 'Yakuky',
      invitedAt: Date.now() - 300 * 86400 * 1000,
    },
  ]);
  const inviteCodes: InviteCode[] = $state([]);
  const articleCount = 10;
  let inviteQuota = $derived.by(() => {
    const quota = articleCount - invitee.length - inviteCodes.length;
    if (quota < 0) {
      return 0;
    }
    return quota;
  });

  let lastId = 0;
  function createInviteCode() {
    const code = Math.random().toString(36).slice(2, 18);
    inviteCodes.push({
      id: ++lastId,
      code,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 86400 * 1000),
      inviterId: 'Nanozuki',
      roleKey: Role.ArticleAuthor,
      usedAt: null,
    });
  }
</script>

<p>
  每发表一篇文章可以邀请 1 位作者，
  {#if inviteQuota > 0}
    你还可以邀请 {inviteQuota} 位作者。
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
  {#if inviteCodes.length > 0}
    <div class="grid-table gap-x-xs gap-y-2xs grid">
      {#each inviteCodes as { code, validTo }}
        <p class="text-accent font-mono">{code}</p>
        <p class="text-subtle">{format(new Date(validTo), 'yyyy-MM-dd HH:mm')} 到期</p>
      {/each}
    </div>
  {:else}
    <p class="text-subtle">暂无邀请码</p>
  {/if}

  {#if inviteQuota > 0}
    <Button onclick={createInviteCode}>创建邀请码({inviteQuota})</Button>
  {/if}
</div>

{#if invitee.length > 0}
  <div>
    <h5 class="font-semibold">已邀请作者</h5>
    <div class="grid-table gap-x-xs gap-y-2xs grid">
      {#each invitee as { name, username, invitedAt }}
        <UserBadge {name} {username} />
        {format(new Date(invitedAt), 'yyyy-MM-dd HH:mm')}
      {/each}
    </div>
  </div>
{/if}

<style>
  .grid-table {
    grid-template-columns: repeat(2, max-content);
  }
</style>
