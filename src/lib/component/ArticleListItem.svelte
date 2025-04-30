<script lang="ts">
  import MdiCalendar from '~icons/mdi/calendar';
  import MdiReply from '~icons/mdi/reply';
  import MdiReplyOutline from '~icons/mdi/reply-outline';
  import MdiCommentTextOutline from '~icons/mdi/comment-text-outline';
  import MdiBookmarkOutline from '~icons/mdi/bookmark-outline';
  import { format } from 'date-fns';
  import type { ArticleListItem } from '$lib/domain/entities/article';
  import UserBadge from './UserBadge.svelte';

  interface ArticleHeaderProps {
    article: ArticleListItem;
  }

  const { article }: ArticleHeaderProps = $props();
  const info = 'flex items-center gap-x-0.5';
</script>

<article>
  <a href="/a/{article.id}">
    <h2 class="font-serif font-bold">{article.title}</h2>
  </a>
  {#if article.replyTo}
    <p class="text-subtle bg-accent-alt/10 px-2xs w-fit">
      <MdiReply style="display: inline; vertical-align: text-top;" />
      <a class="text-accent hover:text-accent-alt inline" href={`/u/${article.replyTo.authorUsername}`}>
        {article.replyTo.authorName}
      </a>
      的
      <a class="text-text inline font-serif font-bold underline" href={`/a/${article.replyTo.id}`}>
        {article.replyTo.title}
      </a>
    </p>
  {/if}
  <div class="gap-x-2xs flex flex-wrap items-center text-sm">
    <UserBadge name={article.authorName} username={article.authorUsername} />
    <div class={info}>
      <MdiCalendar /><span>{format(article.createdAt, 'yyyy-MM-dd')}</span>
    </div>
    {#if article.replyCount > 0}
      <div class={info}><MdiReplyOutline /> {article.replyCount}</div>
    {/if}
    {#if article.commentCount > 0}
      <div class={info}><MdiCommentTextOutline /> {article.commentCount}</div>
    {/if}
    {#if article.bookmarkCount > 0}
      <div class={info}><MdiBookmarkOutline /> {article.bookmarkCount}</div>
    {/if}
  </div>
</article>
