<script lang="ts">
  import MdiReplyOutline from '~icons/mdi/reply-outline';
  import MdiCommentTextOutline from '~icons/mdi/comment-text-outline';
  import MdiTextBoxEditOutline from '~icons/mdi/text-box-edit-outline';
  import Action from '$lib/component/Action.svelte';
  import Bookmark from './Bookmark.svelte';
  import type { PageData } from './$types';

  interface Actions {
    reply: boolean;
    comment: boolean;
    bookmark: boolean;
    edit: boolean;
  }
  interface ActionBarProps extends PageData {
    actions: Actions;
  }

  const props: ActionBarProps = $props();
  const { article, replies, comments, user, actions }: ActionBarProps = $derived(props);
  const badgeClass = 'flex gap-x-1 items-center bg-accent-alt/20 hover:bg-accent-alt/30 py-1 px-2';
</script>

{#if actions.reply || actions.comment || actions.bookmark || (actions.edit && user && user.id === article.authorId)}
  <div class="text-accent-alt flex w-fit gap-x-2 leading-relaxed">
    {#if actions.reply}
      <Action element="a" href="#reply-section">
        <MdiReplyOutline />
        {#if replies.length > 0}{replies.length}{/if} 回应
      </Action>
    {/if}
    {#if actions.comment}
      <Action element="a" href="#comment-section">
        <MdiCommentTextOutline />
        评论 {#if comments.length > 0}{comments.length}{/if}
      </Action>
    {/if}
    {#if user && actions.bookmark}
      <Bookmark data={props} />
    {/if}
    {#if actions.edit && user && user.id === article.authorId}
      <Action element="a" href={`/a/${article.id}/edit`} class={badgeClass}>
        <MdiTextBoxEditOutline />
        编辑
      </Action>
    {/if}
  </div>
{/if}
