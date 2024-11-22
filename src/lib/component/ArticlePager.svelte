<script lang="ts">
  import { goto } from '$app/navigation';
  import { createPagination, melt } from '@melt-ui/svelte';
  import MdiChevronLeft from '~icons/mdi/chevron-left';
  import MdiChevronRight from '~icons/mdi/chevron-right';

  interface Props {
    count: number;
    perPage: number;
    page: number;
    pageLink: (page: number) => string;
  }

  const { count, perPage, page, pageLink }: Props = $props();

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

<nav class="flex flex-col items-center gap-4" aria-label="pagination" use:melt={$root}>
  <div class="flex items-center gap-2">
    <button
      class="grid h-8 items-center rounded-md bg-white px-3 text-sm text-magnum-900 shadow-sm
      hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 data-[selected]:bg-magnum-900
      data-[selected]:text-white"
      use:melt={$prevButton}><MdiChevronLeft class="size-4" /></button
    >
    {#each $pages as page (page.key)}
      {#if page.type === 'ellipsis'}
        <span>...</span>
      {:else}
        <button
          class="grid h-8 items-center rounded-md bg-white px-3 text-sm text-magnum-900 shadow-sm
          hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 data-[selected]:bg-magnum-900
        data-[selected]:text-white"
          use:melt={$pageTrigger(page)}>{page.value}</button
        >
      {/if}
    {/each}
    <button
      class="grid h-8 items-center rounded-md bg-white px-3 text-sm text-magnum-900 shadow-sm
      hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 data-[selected]:bg-magnum-900
    data-[selected]:text-white"
      use:melt={$nextButton}><MdiChevronRight class="size-4" /></button
    >
  </div>
</nav>
