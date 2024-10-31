<script lang="ts">
  import MdiCalendar from '~icons/mdi/calendar';
  import MdiReplyOutline from '~icons/mdi/reply-outline';
  import MdiCommentTextOutline from '~icons/mdi/comment-text-outline';
  import MdiBookmarkOutline from '~icons/mdi/bookmark-outline';
  import { format } from 'date-fns';
  import type { ArticleListItem } from '$lib/domain/entities/article';

  interface ArticleHeaderProps {
    article: ArticleListItem;
    inList?: boolean;
  }

  const { article, inList }: ArticleHeaderProps = $props();
</script>

<article>
  {#if inList}
    <a href="/a/{article.id}">
      <h3>{article.title}</h3>
    </a>
  {:else}
    <h1>{article.title}</h1>
  {/if}
  <div class="info-line">
    <a class="username" href={`/u/${article.authorUsername}`}>{article.authorName}</a>
    <div class="info"><MdiCalendar />发表 {format(article.createdAt, 'yyyy-MM-dd')}</div>
    <!-- </div> -->
    <!-- <div class="info-line"> -->
    {#if article.replyCount > 0}
      <div class="info"><MdiReplyOutline />回复 {article.replyCount}</div>
    {/if}
    {#if article.commentCount > 0}
      <div class="info"><MdiCommentTextOutline />评论 {article.commentCount}</div>
    {/if}
    {#if article.bookmarkCount > 0}
      <div class="info"><MdiBookmarkOutline />收藏 {article.bookmarkCount}</div>
    {/if}
  </div>
</article>

<style>
  a {
    display: block;
  }
  h3 {
    font-family: var(--font-serif);
    font-weight: var(--font-weight-bold);
  }
  a.username {
    color: var(--color-link);
  }
  .info {
    display: flex;
    align-items: center;
    column-gap: var(--space-2xs);
  }
  div.info-line {
    font-size: var(--font-size-s);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: var(--space-xs);
  }
</style>
