<script lang="ts">
  import MdiReplyOutline from '~icons/mdi/reply-outline';
  import MdiCommentTextOutline from '~icons/mdi/comment-text-outline';
  import MdiBookmarkOutline from '~icons/mdi/bookmark-outline';
  import MdiBookmark from '~icons/mdi/bookmark';
  import MdiTextBoxEditOutline from '~icons/mdi/text-box-edit-outline';
  import type { ArticleData } from '$lib/server/interfaces/pages/article_page';

  interface Actions {
    reply: boolean;
    comment: boolean;
    bookmark: boolean;
    edit: boolean;
  }
  interface ActionBarProps extends ArticleData {
    actions: Actions;
  }

  const { article, replies, comments, user, actions }: ActionBarProps = $props();
  const badgeClass = 'flex gap-x-1 items-center bg-accent-alt/20 hover:bg-accent-alt/30 py-1 px-2';
</script>

{#if actions.reply || actions.comment || actions.bookmark || (actions.edit && user?.isAuthor)}
  <div class="w-fit flex gap-x-2 text-accent-alt leading-relaxed">
    {#if actions.reply}
      <div class={badgeClass}>
        <MdiReplyOutline />
        {#if replies.length > 0}{replies.length}{/if} 回应
      </div>
    {/if}
    {#if actions.comment}
      <div class={badgeClass}>
        <MdiCommentTextOutline />
        {#if replies.length > 0}{comments.length}{/if} 评论
      </div>
    {/if}
    {#if actions.bookmark}
      <div class={badgeClass}>
        {#if user?.isBookmarked}<MdiBookmark />{:else}<MdiBookmarkOutline />{/if}
        {#if article.bookmarkCount > 0}{article.bookmarkCount}{/if}
        {#if user?.isBookmarked}已{/if}收藏
      </div>
    {/if}
    {#if actions.edit && user?.isAuthor}
      <a href={`/a/${article.id}/edit`} class={badgeClass}>
        <MdiTextBoxEditOutline />
        编辑
      </a>
    {/if}
  </div>
{/if}
