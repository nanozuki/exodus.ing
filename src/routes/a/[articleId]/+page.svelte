<script lang="ts">
  import MdiCalendar from '~icons/mdi/calendar';
  import MdiReply from '~icons/mdi/reply';
  import Markdown from '$lib/component/Markdown.svelte';
  import { format, formatISO } from 'date-fns';
  import ActionBar from './ActionBar.svelte';
  import ArticleCard from '$lib/component/ArticleCard.svelte';
  import UserBadge from '$lib/component/UserBadge.svelte';
  import InputTextArea from '$lib/component/InputTextArea.svelte';
  import Button from '$lib/component/Button.svelte';
  import { superForm } from 'sveltekit-superforms/client';

  let { data } = $props();
  let { article, comments, focusComment } = $derived(data);

  const actions = {
    reply: false,
    comment: true,
    bookmark: false,
    edit: true,
  };
  const { form: commentForm, errors: commentErrors, enhance: commentEnhance } = superForm(data.commentForm);
  console.log('commentForm', commentForm, 'commentErrors', commentErrors);
  let replyTo = $state<string | null>(null);

  $effect(() => {
    console.log('reload comment: ', comments);
    if (focusComment) {
      document.getElementById('comment-' + focusComment)?.scrollIntoView();
    }
  });
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

<Markdown content={article.content.toString()} title={article.title}>
  {#snippet header()}
    <ActionBar {...{ actions, ...data }} />
    <header class="mb-8 flex flex-col gap-y-2 align-bottom">
      <h1 class="font-serif font-bold">{article.title}</h1>
      <div class="flex flex-wrap items-center gap-x-2xs">
        <UserBadge name={article.authorName} username={article.authorUsername} />
        <div class="flex items-center gap-x-0.5">
          <MdiCalendar />发表于 {format(article.createdAt, 'yyyy-MM-dd')}
        </div>
      </div>
      {#if article.replyTo}
        <div class="text-subtle bg-surface p-2 flex flex-col gap-y-1">
          <div class="flex flex-row gap-x-1"><MdiReply />此文回应了</div>
          <ArticleCard {article} />
        </div>
      {/if}
    </header>
  {/snippet}
</Markdown>

<ActionBar {...{ actions, ...data }} />

<div class="border-t-4 border-accent flex flex-col gap-y-m">
  <h2 class="font-serif font-bold">评论</h2>
  <form method="POST" action="?/comment" class="flex flex-col gap-y-xs" use:commentEnhance>
    <input type="hidden" name="replyTo" value={replyTo} />
    <InputTextArea
      placeholder="发表评论"
      field="content"
      label="新评论"
      bind:value={$commentForm.content}
      bind:errors={$commentErrors.content}
    />
    <Button variant="primary" type="submit">发表评论</Button>
  </form>
  {#each comments as comment (comment.id)}
    <div class="border-t border-border"></div>
    <div id={`comment-${comment.id}`}>
      <div class="flex flex-row items-center gap-x-xs">
        <UserBadge name={comment.author.name} username={comment.author.username} />
        <div class="flex flex-row items-center gap-x-2xs">
          <MdiCalendar />{format(comment.createdAt, 'yyyy-MM-dd HH:mm')}
        </div>
      </div>
      <p>{comment.content}</p>
    </div>
  {/each}
  <div class="border-t border-border"></div>
</div>
