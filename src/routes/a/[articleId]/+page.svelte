<script lang="ts">
  import MdiCalendar from '~icons/mdi/calendar';
  import MdiReply from '~icons/mdi/reply';
  import Markdown from '$lib/component/Markdown.svelte';
  import { format, formatISO } from 'date-fns';
  import ActionBar from './ActionBar.svelte';
  import ArticleCard from '$lib/component/ArticleCard.svelte';
  import UserBadge from '$lib/component/UserBadge.svelte';
  const { data } = $props();
  const { article } = data;
  const actions = {
    reply: false,
    comment: false,
    bookmark: false,
    edit: true,
  };
</script>

<svelte:head>
  <title>{article.title} - EXODUS</title>
  <meta property="og:title" content={article.title} />
  <meta property="og:type" content="article" />
  <meta
    property="og:description"
    content={`${article.authorUsername}, ${format(article.updatedAt, 'yyyy-MM-dd')}`}
  />
  <meta property="article:author" content={article.authorUsername} />
  <meta property="article:published_time" content={formatISO(article.createdAt)} />
  <meta property="article:modified_time" content={formatISO(article.updatedAt)} />
</svelte:head>

<Markdown content={article.content.toString()} title={article.title}>
  {#snippet header()}
    <header class="mb-8 flex flex-col gap-y-2 align-bottom">
      <h1 class="font-serif font-bold">{article.title}</h1>
      <div class="flex flex-wrap items-center gap-x-2xs">
        <UserBadge name={article.authorName} username={article.authorUsername} />
        <div class="flex items-center gap-x-0.5">
          <MdiCalendar />发表于 {format(article.createdAt, 'yyyy-MM-dd')}
        </div>
      </div>
      <ActionBar {...{ actions, ...data }} />
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
