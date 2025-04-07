<script lang="ts">
  import { goto } from '$app/navigation';
  import { createPagination, melt } from '@melt-ui/svelte';
  import { twMerge } from 'tailwind-merge';
  import MdiChevronLeft from '~icons/mdi/chevron-left';
  import MdiChevronRight from '~icons/mdi/chevron-right';

  interface Props {
    ['class']?: string;
    count: number;
    perPage: number;
    page: number;
    pageLink: (page: number) => string;
  }

  const { count, perPage, page, pageLink, class: outerClass }: Props = $props();

  const {
    elements: { root, pageTrigger, prevButton, nextButton },
    states: { pages },
  } = createPagination({
    count,
    perPage,
    defaultPage: page,
    siblingCount: 1,
    onPageChange: (args): number => {
      goto(pageLink(args.next));
      return args.next;
    },
  });
</script>

<nav class={twMerge('flex flex-row items-center gap-xs', outerClass)} aria-label="pagination" use:melt={$root}>
  <button
    class="grid h-8 min-w-8 items-center justify-center px-0.5 bg-text/20 hover:bg-text/30 text-text border-2 border-text
    disabled:cursor-not-allowed disabled:bg-highlight-med disabled:text-muted disabled:border-muted
    data-selected:border-accent data-selected:bg-accent/20 data-selected:text-accent"
    use:melt={$prevButton}
  >
    <MdiChevronLeft class="size-6" />
  </button>
  {#each $pages as page (page.key)}
    {#if page.type === 'ellipsis'}
      <div class="grid h-8 items-center justify-center text-text">
        <span>/</span>
      </div>
    {:else}
      <button
        class="grid h-8 min-w-8 items-center justify-center px-0.5 bg-text/20 hover:bg-text/30 text-text border-2 border-text
        disabled:cursor-not-allowed disabled:bg-highlight-med disabled:text-muted disabled:border-muted
        data-selected:border-accent data-selected:bg-accent/20 data-selected:text-accent"
        use:melt={$pageTrigger(page)}
      >
        {page.value}
      </button>
    {/if}
  {/each}
  <button
    class="grid h-8 min-w-8 items-center justify-center px-0.5 bg-text/20 hover:bg-text/30 text-text border-2 border-text
    disabled:cursor-not-allowed disabled:bg-highlight-med disabled:text-muted disabled:border-muted
    data-selected:border-accent data-selected:bg-accent/20 data-selected:text-accent"
    use:melt={$nextButton}
  >
    <MdiChevronRight class="size-6" />
  </button>
</nav>
