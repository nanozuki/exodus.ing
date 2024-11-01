<script lang="ts">
  import MdiCalendar from '~icons/mdi/calendar';
  import MdiReplyOutline from '~icons/mdi/reply-outline';
  import MdiCommentTextOutline from '~icons/mdi/comment-text-outline';
  import MdiBookmarkOutline from '~icons/mdi/bookmark-outline';
  import { format } from 'date-fns';
  import type { ArticleListItem } from '$lib/domain/entities/article';

  interface ArticleHeaderProps {
    article: ArticleListItem;
  }

  const { article }: ArticleHeaderProps = $props();
  const info = 'flex items-center gap-x-0.5';
</script>

<article>
  <a href="/a/{article.id}">
    <h3 class="font-serif font-bold">{article.title}</h3>
  </a>
  <div class="text-sm flex flex-wrap items-center gap-x-2xs">
    <a class="text-link visited:text-link-visited" href={`/u/${article.authorUsername}`}
      >{article.authorName}</a
    >
    <div class={info}>
      <MdiCalendar /><span>发表</span><span>{format(article.createdAt, 'yyyy-MM-dd')}</span>
    </div>
    {#if article.replyCount > 0}
      <div class={info}><MdiReplyOutline />回复 {article.replyCount}</div>
    {/if}
    {#if article.commentCount > 0}
      <div class={info}><MdiCommentTextOutline />评论 {article.commentCount}</div>
    {/if}
    {#if article.bookmarkCount > 0}
      <div class={info}><MdiBookmarkOutline />收藏 {article.bookmarkCount}</div>
    {/if}
  </div>
</article>
