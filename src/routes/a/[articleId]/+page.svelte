<script lang="ts">
  import Markdown from '$lib/component/Markdown.svelte';
  import MdiArrowTopRight from '~icons/mdi/arrow-top-right';
  import { format, formatISO } from 'date-fns';
  import Replies from './Replies.svelte';
  import Comments from './Comments.svelte';
  import { getArticleDetailById, listRepliesOfArticle } from '$remotes/articles.remote';
  import ReplyBadge from './ReplyBadge.svelte';
  import CommentBadge from './CommentBadge.svelte';
  import { listCommentsOfArticle } from '$remotes/comments.remote';
  import BookmarkBadge from './BookmarkBadge.svelte';
  import EditBadge from './EditBadge.svelte';
  import { getArticleBookmarkStatus } from '$remotes/bookmarks.remote';
  import Title from './Title.svelte';

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

{#if article.contentType === 'markdown'}
  <article>
    <Title {article}>
      <div class="text-accent-alt flex w-fit gap-x-2 leading-relaxed">
        <ReplyBadge count={replies.length} />
        <CommentBadge count={comments.length} />
        <BookmarkBadge key="top" {articleId} status={bookmarkStatus} />
        <EditBadge {user} {article} />
      </div>
    </Title>
    <Markdown markup={article.markup}></Markdown>
  </article>
{:else}
  <article>
    <Title {article}></Title>
    <div class="mb-xl">
      <p>此文章发表于站外</p>
      <a href={article.content} target="_blank" rel="noopener noreferrer" class="underline">
        阅读原文<MdiArrowTopRight class="inline" />
      </a>
    </div>
  </article>
{/if}

<div class="text-accent-alt flex w-fit gap-x-2 leading-relaxed">
  <BookmarkBadge key="bottom" {articleId} status={bookmarkStatus} />
  <EditBadge {user} {article} />
</div>

<Replies {articleId} {replies} {user} />

<Comments {articleId} {comments} {user} />
