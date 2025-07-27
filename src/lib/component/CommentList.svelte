<script lang="ts">
  import ArticleCard from '$lib/component/ArticleCard.svelte';
  import Pager from '$lib/component/Pager.svelte';
  import { type CommentListItem, COMMENT_PAGE_SIZE } from '$lib/domain/entities/comment';
  import type { Paginated } from '$lib/domain/values/page';
  import { format } from 'date-fns';
  import { twMerge } from 'tailwind-merge';

  interface Props {
    ['class']?: string;
    comments: Paginated<CommentListItem>;
    pageLink: (page: number) => string;
  }

  let { comments, pageLink, class: outerClass }: Props = $props();
  let { pageNumber, count, items } = $derived(comments);
</script>

<div class={twMerge('gap-y-m flex flex-col', outerClass)}>
  <ul class="gap-y-m flex flex-col">
    {#each items as item (item.article.id)}
      <li class="gap-y-xs flex flex-col">
        <ArticleCard article={item.article} />
        {#each item.comments as comment (comment.id)}
          <div class="bg-quote-even px-2">
            <p class="text-muted">{format(new Date(comment.updatedAt), 'yyyy-MM-dd HH:mm')}</p>
            <p>{comment.content}</p>
          </div>
        {/each}
      </li>
    {/each}
  </ul>
  {#if count > COMMENT_PAGE_SIZE}
    <Pager class="bg-base " {count} perPage={COMMENT_PAGE_SIZE} page={pageNumber} {pageLink} />
  {/if}
</div>
