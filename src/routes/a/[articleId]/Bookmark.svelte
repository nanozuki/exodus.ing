<script lang="ts">
  import Action from '$lib/component/Action.svelte';
  import MdiBookmarkOutline from '~icons/mdi/bookmark-outline';
  import MdiBookmark from '~icons/mdi/bookmark';
  import type { PageData } from './$types';
  import { superForm } from 'sveltekit-superforms/client';

  const { data }: { data: PageData } = $props();
  const { user, article } = $derived(data);
  let processing = $state(false);
  const { form, enhance } = superForm(data.bookmarkForm, {
    onSubmit: () => {
      processing = true;
    },
    onResult: () => {
      processing = false;
    },
  });
</script>

<form action="?/bookmark" method="POST" use:enhance>
  <input type="hidden" name="action" value={$form.action} />
  <input type="hidden" name="articleId" value={$form.articleId} />
  <Action element="button" disabled={processing} {processing} type="submit" class="flex items-center gap-x-1 px-2 py-1">
    {#if user?.isBookmarked}<MdiBookmark />{:else}<MdiBookmarkOutline />{/if}
    <span
      >{#if user?.isBookmarked}已收藏{:else}收藏{/if}</span
    >
    <span
      >{#if article.bookmarkCount > 0}{article.bookmarkCount}{/if}</span
    >
  </Action>
</form>
