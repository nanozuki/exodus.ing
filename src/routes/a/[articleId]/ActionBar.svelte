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
</script>

{#if actions.reply || actions.comment || actions.bookmark || (actions.edit && user?.isAuthor)}
  <div class="flex gap-x-2 border-t border-b text-accent-alt border-accent-alt/60 leading-relaxed">
    {#if actions.reply}
      <div class="flex gap-x-1 items-center hover:bg-accent-alt/30 py-0.5 px-1">
        <MdiReplyOutline />
        {#if replies.length > 0}{replies.length}{/if} 回应
      </div>
    {/if}
    {#if actions.comment}
      <div class="flex gap-x-1 items-center hover:bg-accent-alt/30 py-0.5 px-1">
        <MdiCommentTextOutline />
        {#if replies.length > 0}{comments.length}{/if} 评论
      </div>
    {/if}
    {#if actions.bookmark}
      <div class="flex gap-x-1 items-center hover:bg-accent-alt/30 py-0.5 px-1">
        {#if user?.isBookmarked}<MdiBookmark />{:else}<MdiBookmarkOutline />{/if}
        {#if article.bookmarkCount > 0}{article.bookmarkCount}{/if}
        {#if user?.isBookmarked}已{/if}收藏
      </div>
    {/if}
    {#if actions.edit && user?.isAuthor}
      <a
        href={`/a/${article.id}/edit`}
        class="flex flex-x-1 gap-x-1 items-center hover:bg-accent-alt/30 py-0.5 px-1"
      >
        <MdiTextBoxEditOutline />
        编辑
      </a>
    {/if}
  </div>
{/if}
