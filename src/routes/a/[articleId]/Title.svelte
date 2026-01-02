<script lang="ts">
  import type { ArticleDetail } from '$lib/domain/entities/article';
  import MdiCalendar from '~icons/mdi/calendar';
  import MdiReply from '~icons/mdi/reply';
  import { format } from 'date-fns';
  import UserBadge from '$lib/component/UserBadge.svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    article: ArticleDetail;
    children?: Snippet;
  };

  const { article, children }: Props = $props();
</script>

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
  {#if children}
    {@render children()}
  {/if}
</header>
