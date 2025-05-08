<script lang="ts">
  import Action from '$lib/component/Action.svelte';
  import Button from '$lib/component/Button.svelte';
  import InputTextArea from '$lib/component/InputTextArea.svelte';
  import MdiCalendar from '~icons/mdi/calendar';
  import MdiReply from '~icons/mdi/reply';
  import MdiTextBoxEditOutline from '~icons/mdi/text-box-edit-outline';
  import UserBadge from '$lib/component/UserBadge.svelte';
  import type { PageData } from './$types';
  import { format } from 'date-fns';
  import { superForm } from 'sveltekit-superforms/client';
  import type { CommentView } from '$lib/domain/entities/comment';

  let { data }: { data: PageData } = $props();
  let { article, comments, user } = $derived(data);
  let authNext = $derived(encodeURIComponent(`/a/${article.id}#comment-section`));
  let btnVariant = $state<'primary' | 'disabled'>('primary');
  const { form, errors, enhance } = superForm(data.commentForm, {
    onSubmit: () => {
      btnVariant = 'disabled';
    },
    onResult: () => {
      btnVariant = 'primary';
    },
  });

  let formState = $state<'new' | 'edit'>('new');
  let replyTo = $state<string | undefined>(undefined);
  let replied = $derived.by(() => {
    return replyTo ? comments.find((comment) => comment.id === replyTo) : undefined;
  });

  const reply = (commentId: string) => {
    formState = 'new';
    form.set({ action: 'new', content: '', replyTo: commentId, commentId: undefined });
    replyTo = commentId;
    document.getElementById('comment-input')?.scrollIntoView();
    document.getElementById('comment-input')?.focus();
  };
  const edit = (comment: CommentView) => {
    formState = 'edit';
    form.set({
      action: 'edit',
      content: comment.content,
      replyTo: comment.replyTo?.id,
      commentId: comment.id,
    });
    replyTo = comment.replyTo?.id;
    document.getElementById('comment-input')?.scrollIntoView();
    document.getElementById('comment-input')?.focus();
  };
</script>

<div id="comment-section" class="border-accent gap-y-m flex flex-col border-t-4">
  <h2 class="pt-1 font-serif font-bold">评论</h2>
  {#if user}
    <form method="POST" action="?/comment" class="gap-y-xs flex flex-col" use:enhance>
      {#if replied}
        <div class="bg-overlay p-1">
          <p>回复 <UserBadge name={replied.author.name} username={replied.author.username} /></p>
          <p class="text-subtle">{replied.content}</p>
        </div>
      {/if}
      <input type="hidden" name="action" value={formState} />
      <input type="hidden" name="replyTo" value={replyTo} />
      <input type="hidden" name="commentId" value={$form.commentId} />
      <InputTextArea
        id="comment-input"
        placeholder={formState === 'new' ? '发表评论' : '更新评论'}
        field="content"
        label={formState === 'new' ? '新评论' : '编辑评论'}
        bind:value={$form.content}
        bind:errors={$errors.content}
      />
      <Button variant={btnVariant} type="submit">{formState === 'new' ? '发表评论' : '更新评论'}</Button>
    </form>
  {:else}
    <div class="bg-overlay p-m flex flex-row items-center justify-between">
      <p>登录后方可评论</p>
      <Action element="a" href={`/auth?next=${authNext}`}>登录/注册</Action>
    </div>
  {/if}
  {#if comments.length > 0}
    <h6 class="pt-1 font-bold">
      评论 {comments.length}
    </h6>
  {/if}
  <div class="gap-y-m flex flex-col">
    {#each comments as comment (comment.id)}
      <div class="border-border border-t"></div>
      <div id={`comment-${comment.id}`}>
        <div class="gap-x-xs flex flex-row items-center">
          <UserBadge name={comment.author.name} username={comment.author.username} />
          <div class="gap-x-2xs flex flex-row items-center">
            <MdiCalendar />{format(comment.createdAt, 'yyyy-MM-dd HH:mm')}
          </div>
          <div class="flex-1"></div>
        </div>
        {#if comment.replyTo}
          <div class="bg-overlay p-1">
            <p>回复 <UserBadge name={comment.replyTo.author.name} username={comment.replyTo.author.username} /></p>
            {#each comment.replyTo.content.split('\n') as line}
              <p class="text-subtle">{line}</p>
            {/each}
          </div>
        {/if}
        {#each comment.content.split('\n') as line}
          <p class="py-2 pt-1">{line}</p>
        {/each}
        {#if user}
          <div class="flex flex-row gap-x-2">
            <Action element="button" onclick={() => reply(comment.id)}><MdiReply />回复</Action>
            {#if user && user.id === comment.author.id}
              <Action element="button" onclick={() => edit(comment)}><MdiTextBoxEditOutline /> 编辑</Action>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
    <div class="border-border border-t"></div>
  </div>
</div>
