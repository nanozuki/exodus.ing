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
  } = $derived(
    createPagination({
      count,
      perPage,
      defaultPage: page,
      siblingCount: 1,
      onPageChange: (args): number => {
        goto(pageLink(args.next));
        return args.next;
      },
    }),
  );
</script>

<nav class={twMerge('gap-xs flex flex-row items-center', outerClass)} aria-label="pagination" use:melt={$root}>
  <button
    class="bg-text/20 hover:bg-text/30 text-text border-text disabled:bg-highlight-med disabled:text-muted disabled:border-muted data-selected:border-accent data-selected:bg-accent/20 data-selected:text-accent grid
    h-8 min-w-8 items-center justify-center
    border-2 px-0.5 disabled:cursor-not-allowed"
    use:melt={$prevButton}
  >
    <MdiChevronLeft class="size-6" />
  </button>
  {#each $pages as page (page.key)}
    {#if page.type === 'ellipsis'}
      <div class="text-text grid h-8 items-center justify-center">
        <span>/</span>
      </div>
    {:else}
      <button
        class="bg-text/20 hover:bg-text/30 text-text border-text disabled:bg-highlight-med disabled:text-muted disabled:border-muted data-selected:border-accent data-selected:bg-accent/20 data-selected:text-accent grid
        h-8 min-w-8 items-center justify-center
        border-2 px-0.5 disabled:cursor-not-allowed"
        use:melt={$pageTrigger(page)}
      >
        {page.value}
      </button>
    {/if}
  {/each}
  <button
    class="bg-text/20 hover:bg-text/30 text-text border-text disabled:bg-highlight-med disabled:text-muted disabled:border-muted data-selected:border-accent data-selected:bg-accent/20 data-selected:text-accent grid
    h-8 min-w-8 items-center justify-center
    border-2 px-0.5 disabled:cursor-not-allowed"
    use:melt={$nextButton}
  >
    <MdiChevronRight class="size-6" />
  </button>
</nav>
