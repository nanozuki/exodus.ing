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
  const hasPrev = $derived(page > 1);
  const hasNext = $derived(page < totalPages);

  // Shift the window at either end so navigation keeps a stable number of nearby pages.
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
    variant={hasPrev ? 'normal' : 'disabled'}
    href={hasPrev ? pageLink(page - 1) : undefined}
    aria-disabled={!hasPrev}
    aria-label="Previous page"
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
        aria-current={item === page ? 'page' : undefined}
        aria-label={item === page ? `Current page, page ${item}` : `Go to page ${item}`}
      >
        {item}
      </ButtonLink>
    {/if}
  {/each}
  <ButtonLink
    class="h-8 w-8 p-0.5"
    variant={hasNext ? 'normal' : 'disabled'}
    href={hasNext ? pageLink(page + 1) : undefined}
    aria-disabled={!hasNext}
    aria-label="Next page"
  >
    <MdiChevronRight class="size-6" />
  </ButtonLink>
</nav>
