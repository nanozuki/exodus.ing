<script lang="ts">
  import ArticleCard from '$lib/component/ArticleCard.svelte';
  import Pager from '$lib/component/Pager.svelte';
  import type { CommentListItem } from '$lib/domain/entities/comment';
  import type { Paginated } from '$lib/domain/values/page';
  import { COMMENT_PAGE_SIZE } from '$lib/domain/services/comment';
  import { format } from 'date-fns';
  import { twMerge } from 'tailwind-merge';

  interface Props {
    ['class']?: string;
    comments: Paginated<CommentListItem>;
    pageLink: (page: number) => string;
  }

  let { comments, pageLink, class: outerClass }: Props = $props();
  let { pageNumber, count, items } = $derived(comments);
  let hashedLink = $derived((page: number) => {
    return pageLink(page) + '#comment-list';
  });
</script>

<div id="comment-list" class={twMerge('gap-y-m flex flex-col', outerClass)}>
  {#if count > COMMENT_PAGE_SIZE}
    <Pager class="bg-base sticky top-0" {count} perPage={COMMENT_PAGE_SIZE} page={pageNumber} pageLink={hashedLink} />
  {/if}
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
</div>
