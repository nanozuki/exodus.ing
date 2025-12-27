<script lang="ts">
  import Action from '$lib/component/Action.svelte';
  import Button from '$lib/component/Button.svelte';
  import InputTextArea from '$lib/component/InputTextArea.svelte';
  import MdiCalendar from '~icons/mdi/calendar';
  import MdiReply from '~icons/mdi/reply';
  import MdiTextBoxEditOutline from '~icons/mdi/text-box-edit-outline';
  import UserBadge from '$lib/component/UserBadge.svelte';
  import { format } from 'date-fns';
  import type { CommentView } from '$lib/domain/entities/comment';
  import { addComment, editComment } from '$remotes/comments.remote';
  import type { RemoteFormIssue } from '@sveltejs/kit';
  import type { User } from '$lib/domain/entities/user';

  type CommentsProps = {
    articleId: string;
    comments: CommentView[];
    user: User | null;
  };
  let { articleId, comments, user }: CommentsProps = $props();
  let authNext = $derived(encodeURIComponent(`/a/${articleId}#comment-section`));
  let btnVariant = $state<'primary' | 'disabled'>('primary');

  let formAction = $state<'new' | 'edit'>('new');
  let editCommentId = $state<string | undefined>(undefined);
  let replyTo = $state<string | undefined>(undefined);
  let replied = $derived.by(() => {
    return replyTo ? comments.find((comment: CommentView) => comment.id === replyTo) : undefined;
  });
  let content = $state<string>('');

  const getIssuesMessage = (issues: RemoteFormIssue[] | undefined) => {
    if (issues === undefined || issues.length === 0) {
      return undefined;
    }
    return issues.map((issue) => issue.message).join(', ');
  };

  const reply = (commentId: string) => {
    formAction = 'new';
    replyTo = commentId;
    document.getElementById('comment-input')?.scrollIntoView();
    document.getElementById('comment-input')?.focus();
  };
  const edit = (comment: CommentView) => {
    formAction = 'edit';
    editCommentId = comment.id;
    replyTo = comment.replyTo?.id;
    content = comment.content;
    document.getElementById('comment-input')?.scrollIntoView();
    document.getElementById('comment-input')?.focus();
  };

  // TODO: simplify the logic of two forms
</script>

<div id="comment-section" class="border-accent gap-y-m flex flex-col border-t-4">
  <h2 class="pt-1 font-serif font-bold">评论</h2>
  {#if user}
    {#if formAction === 'new'}
      <form {...addComment} class="gap-y-xs flex flex-col">
        {#if replied}
          <div class="bg-overlay p-1">
            <p>回复 <UserBadge name={replied.author.name} username={replied.author.username} /></p>
            <p class="text-subtle">{replied.content}</p>
          </div>
        {/if}
        <input type="hidden" name="articleId" value={articleId} />
        <input type="hidden" name="replyTo" value={replyTo} />
        <InputTextArea
          id="comment-input"
          placeholder={'发表评论'}
          field="content"
          label={'新评论'}
          error={getIssuesMessage(addComment.fields.content.issues())}
          bind:value={content}
        />
        <div class="flex flex-row gap-x-2">
          {#if content.length > 0}
            <Button
              variant="normal"
              type="button"
              onclick={() => {
                content = '';
                replyTo = undefined;
              }}>{'取消'}</Button
            >
          {/if}
          <Button variant={btnVariant} type="submit">{'发表评论'}</Button>
        </div>
      </form>
    {:else if formAction === 'edit'}
      <form
        {...editComment.enhance(async ({ form, submit }) => {
          await submit();
          form.reset();
          formAction = 'new';
        })}
        class="gap-y-xs flex flex-col"
      >
        {#if replied}
          <div class="bg-overlay p-1">
            <p>回复 <UserBadge name={replied.author.name} username={replied.author.username} /></p>
            <p class="text-subtle">{replied.content}</p>
          </div>
        {/if}
        <input type="hidden" name="commentId" value={editCommentId} />
        <InputTextArea
          id="comment-input"
          placeholder={'编辑评论'}
          field="content"
          label={'编辑评论'}
          error={getIssuesMessage(editComment.fields.content.issues())}
          bind:value={content}
        />
        <div class="flex flex-row gap-x-2">
          {#if content.length > 0}
            <Button
              variant="normal"
              type="button"
              onclick={() => {
                content = '';
                replyTo = undefined;
              }}>{'取消'}</Button
            >
          {/if}
          <Button variant={btnVariant} type="submit">{'更新评论'}</Button>
        </div>
      </form>
    {/if}
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
