<script lang="ts">
  import Action from '#lib/component/Action.svelte';
  import MdiBookmarkOutline from '~icons/mdi/bookmark-outline';
  import MdiBookmark from '~icons/mdi/bookmark';
  import { operateArticleBookmark } from './BookmarkBadge.remote';
  import type { BookmarkState } from '#lib/models/bookmark.js';

  type BookmarkProps = {
    articleId: string;
    key: string;
    status: BookmarkState;
  };

  const { articleId, key, status }: BookmarkProps = $props();

  const { bookmarked: isBookmarked, count: bookmarkCount } = $derived(status);
  const operateBookmark = $derived(operateArticleBookmark.for(key));
</script>

<form {...operateBookmark} method="POST">
  <input {...operateBookmark.fields.action.as('hidden', isBookmarked ? 'remove' : 'add')} />
  <input {...operateBookmark.fields.articleId.as('hidden', articleId)} />
  <Action element="button" type="submit" class="flex items-center gap-x-1 px-2 py-1">
    {#if isBookmarked}
      <MdiBookmark /><span>已收藏</span>
    {:else}
      <MdiBookmarkOutline /><span>收藏</span>
    {/if}
    {#if bookmarkCount > 0}<span>{bookmarkCount}</span>{/if}
  </Action>
</form>
