<script lang="ts">
  import MdiCalendar from '~icons/mdi/calendar';
  import MdiReply from '~icons/mdi/reply';
  import Markdown from '$lib/component/Markdown.svelte';
  import { format, formatISO } from 'date-fns';
  import ActionBar from './ActionBar.svelte';
  import UserBadge from '$lib/component/UserBadge.svelte';
  import Replies from './Replies.svelte';
  import Comments from './Comments.svelte';

  let { data } = $props();
  let { article } = $derived(data);
  let content = $derived(article.content.toString());

  const topActions = {
    reply: true,
    comment: true,
    bookmark: true,
    edit: true,
  };
  const buttomActions = {
    reply: false,
    comment: false,
    bookmark: true,
    edit: true,
  };
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

<Markdown {content} title={article.title}>
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
          <a class="text-accent hover:text-accent-alt inline" href={`/u/${article.replyTo.authorUsername}`}>
            {article.replyTo.authorName}
          </a>
          的
          <a class="text-text inline font-serif font-bold underline" href={`/a/${article.replyTo.id}`}>
            {article.replyTo.title}
          </a>
        </p>
      {/if}
      <ActionBar {...{ actions: topActions, ...data }} />
    </header>
  {/snippet}
</Markdown>

<ActionBar {...{ actions: buttomActions, ...data }} />

<Replies {data} />

<Comments {data} />
