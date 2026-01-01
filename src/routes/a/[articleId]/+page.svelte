<script lang="ts">
  import MdiCalendar from '~icons/mdi/calendar';
  import MdiReply from '~icons/mdi/reply';
  import Markdown from '$lib/component/Markdown.svelte';
  import { format, formatISO } from 'date-fns';
  import UserBadge from '$lib/component/UserBadge.svelte';
  import Replies from './Replies.svelte';
  import Comments from './Comments.svelte';
  import { getArticleDetailById, listRepliesOfArticle } from '$remotes/articles.remote';
  import ReplyBadge from './ReplyBadge.svelte';
  import CommentBadge from './CommentBadge.svelte';
  import { listCommentsOfArticle } from '$remotes/comments.remote';
  import BookmarkBadge from './BookmarkBadge.svelte';
  import EditBadge from './EditBadge.svelte';
  import { getArticleBookmarkStatus } from '$remotes/bookmarks.remote';

  let { data, params } = $props();
  const user = $derived(data.user);
  const articleId = $derived(params.articleId);

  // queries
  const articleQ = $derived(getArticleDetailById(articleId));
  const repliesQ = $derived(listRepliesOfArticle(articleId));
  const commentsQ = $derived(listCommentsOfArticle(articleId));
  const bookmarkStatusQ = $derived(getArticleBookmarkStatus(articleId));
  const article = $derived(await articleQ);
  const replies = $derived(await repliesQ);
  const comments = $derived(await commentsQ);
  const bookmarkStatus = $derived(await bookmarkStatusQ);
</script>

<svelte:head>
  <title>{article.title} - EXODUS</title>
  <meta property="og:title" content={article.title} />
  <meta property="og:type" content="article" />
  <meta property="og:description" content={`${article.authorUsername}, ${format(article.updatedAt, 'yyyy-MM-dd')}`} />
  <meta property="article:author" content={article.authorUsername} />
  <meta property="article:published_time" content={formatISO(article.createdAt)} />
  <meta property="article:modified_time" content={formatISO(article.updatedAt)} />
</svelte:head>

<Markdown markup={article.markup} title={article.title}>
  {#snippet header()}
    <header class="mb-2xl gap-y-xs flex flex-col align-bottom">
      <h1 class="font-serif font-bold">{article.title}</h1>
      <div class="gap-x-2xs flex flex-wrap items-center">
        <UserBadge name={article.authorName} username={article.authorUsername} />
        <div class="flex items-center gap-x-0.5">
          <MdiCalendar />发表于 {format(article.createdAt, 'yyyy-MM-dd')}
        </div>
      </div>
      {#if article.replyTo}
        <p class="text-subtle bg-accent-alt/10 px-xs w-fit py-0.5">
          <MdiReply style="display: inline; vertical-align: text-top;" />
          此文回应了
          <a class="text-accent hover:text-accent-alt inline" href={`/u/@${article.replyTo.authorUsername}`}>
            {article.replyTo.authorName}
          </a>
          的
          <a class="text-text inline font-serif font-bold underline" href={`/a/${article.replyTo.id}`}>
            {article.replyTo.title}
          </a>
        </p>
      {/if}
      <div class="text-accent-alt flex w-fit gap-x-2 leading-relaxed">
        <ReplyBadge count={replies.length} />
        <CommentBadge count={comments.length} />
        <BookmarkBadge key="top" {articleId} status={bookmarkStatus} />
        <EditBadge {user} {article} />
      </div>
    </header>
  {/snippet}
</Markdown>

<div class="text-accent-alt flex w-fit gap-x-2 leading-relaxed">
  <BookmarkBadge key="bottom" {articleId} status={bookmarkStatus} />
  <EditBadge {user} {article} />
</div>

<Replies {articleId} {replies} {user} />

<Comments {articleId} {comments} {user} />
