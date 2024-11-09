<script lang="ts">
  import MdiCalendar from '~icons/mdi/calendar';
  import MdiReply from '~icons/mdi/reply';
  import { format } from 'date-fns';
  import UserBadge from '$lib/component/UserBadge.svelte';
  import InputTextArea from '$lib/component/InputTextArea.svelte';
  import Button from '$lib/component/Button.svelte';
  import { superForm } from 'sveltekit-superforms/client';
  import Action from '$lib/component/Action.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let { comments } = $derived(data);
  const { form, errors, enhance } = superForm(data.commentForm);

  let replyTo = $state<string | null>(null);
  let replied = $derived.by(() => {
    return replyTo ? comments.find((comment) => comment.id === replyTo) : undefined;
  });
  const reply = (commentId: string) => {
    replyTo = commentId;
    document.getElementById('comment-input')?.scrollIntoView();
    document.getElementById('comment-input')?.focus();
  };
</script>

<div class="border-t-4 border-accent flex flex-col gap-y-m">
  <h2 class="font-serif font-bold">评论</h2>
  <form method="POST" action="?/comment" class="flex flex-col gap-y-xs" use:enhance>
    {#if replied}
      <div class="bg-overlay p-1">
        <p>回复 <UserBadge name={replied.author.name} username={replied.author.username} /></p>
        <p class="text-subtle">{replied.content}</p>
      </div>
    {/if}
    <input type="hidden" name="replyTo" value={replyTo} />
    <InputTextArea
      id="comment-input"
      placeholder="发表评论"
      field="content"
      label={replyTo ? '回复评论' : '新评论'}
      bind:value={$form.content}
      bind:errors={$errors.content}
    />
    <Button variant="primary" type="submit">发表评论</Button>
  </form>
  <div class="flex flex-col gap-y-m">
    {#each comments as comment (comment.id)}
      <div class="border-t border-border"></div>
      <div id={`comment-${comment.id}`}>
        <div class="flex flex-row items-center gap-x-xs">
          <UserBadge name={comment.author.name} username={comment.author.username} />
          <div class="flex flex-row items-center gap-x-2xs">
            <MdiCalendar />{format(comment.createdAt, 'yyyy-MM-dd HH:mm')}
          </div>
          <div class="flex-1"></div>
        </div>
        <p class="pt-1 py-2">{comment.content}</p>
        <Action element="button" onclick={() => reply(comment.id)}><MdiReply />回复</Action>
      </div>
    {/each}
    <div class="border-t border-border"></div>
  </div>
</div>
