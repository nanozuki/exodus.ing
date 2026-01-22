<!--
@component Pagination navigation using links. Always show first and last page, current page and siblingCount pages
around current page. If there are enough pages, pager shows like:
> [1] ['ellipsis'] [current-siblingCount, current+siblingCount], ['ellipsis'] [totalPages]
Considering in this situation, there are "siblingCount * 2 + 3 (1, last, page)" pages shown, to prevent function
regression, we don't show less pages than that. So:

Define the dynamically filled portion as [start, end]
- if totalPage <= siblingCount * 2 + 3, set start = 2, end = totalPages - 1
- [start, end] = [page - siblingCount, page + siblingCount]
  - if start <= 1: start => 2, end => end + (2 - start)
  - if end >= totalPage: end => totalPage -1, start => start - (end - (totalPage -1))
-->
<script lang="ts">
  import MdiChevronLeft from '~icons/mdi/chevron-left';
  import MdiChevronRight from '~icons/mdi/chevron-right';
  import ButtonLink from './ButtonLink.svelte';

  interface Props {
    count: number;
    pageSize: number;
    page: number;
    siblingCount?: number;
    pageLink: (page: number) => string;
  }
  type PageItem = number | 'ellipsis';
  const { count, pageSize, page, siblingCount = 1, pageLink }: Props = $props();
  const totalPages = $derived(Math.ceil(count / pageSize));
  const pageItems = $derived.by(() => {
    let start: number;
    let end: number;
    if (totalPages <= siblingCount * 2 + 3) {
      start = 2;
      end = totalPages - 1;
    } else {
      start = page - siblingCount;
      end = page + siblingCount;
      if (start <= 1) {
        end += 2 - start;
        start = 2;
      }
      if (end >= totalPages) {
        start -= end - (totalPages - 1);
        end = totalPages - 1;
      }
    }

    const items: PageItem[] = [1];
    if (start > 2) {
      items.push('ellipsis');
    }
    for (let i = start; i <= end; i++) {
      items.push(i);
    }
    if (end < totalPages - 1) {
      items.push('ellipsis');
    }
    if (totalPages > 1) {
      items.push(totalPages);
    }
    return items;
  });
</script>

<nav class="gap-xs flex flex-row items-center" aria-label="pagination">
  <ButtonLink
    class="h-8 w-8 p-0.5"
    variant={page === 1 ? 'disabled' : 'normal'}
    href={page === 1 ? undefined : pageLink(page - 1)}
  >
    <MdiChevronLeft class="size-6" />
  </ButtonLink>
  {#each pageItems as item}
    {#if item === 'ellipsis'}
      <div class="text-text grid h-8 items-center justify-center">
        <span>/</span>
      </div>
    {:else}
      <ButtonLink
        class="flex h-8 w-fit min-w-8 items-center justify-center p-0.5 font-normal"
        variant={item === page ? 'accent' : 'normal'}
        href={pageLink(item)}
      >
        {item}
      </ButtonLink>
    {/if}
  {/each}
  <ButtonLink class="h-8 w-8 p-0.5" variant={page === totalPages ? 'disabled' : 'normal'} href={pageLink(page + 1)}>
    <MdiChevronRight class="size-6" />
  </ButtonLink>
</nav>
