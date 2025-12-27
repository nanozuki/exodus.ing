<script lang="ts">
  import Action from '$lib/component/Action.svelte';
  import MdiBookmarkOutline from '~icons/mdi/bookmark-outline';
  import MdiBookmark from '~icons/mdi/bookmark';
  import { operateArticleBookmark } from '$remotes/bookmarks.remote';
  import type { BookmarkStatus } from '$lib/domain/entities/bookmark';

  type BookmarkProps = {
    articleId: string;
    key: string;
    status: BookmarkStatus;
  };
  const { articleId, key, status }: BookmarkProps = $props();
  const { isBookmarked, bookmarkCount } = $derived(status);
  const operateBookmark = $derived(operateArticleBookmark.for(key));
</script>

<form {...operateBookmark} method="POST">
  <input type="hidden" name="action" value={isBookmarked ? 'remove' : 'add'} />
  <input type="hidden" name="articleId" value={articleId} />
  <Action element="button" type="submit" class="flex items-center gap-x-1 px-2 py-1">
    {#if isBookmarked}
      <MdiBookmark /><span>已收藏</span>
    {:else}
      <MdiBookmarkOutline /><span>收藏</span>
    {/if}
    {#if bookmarkCount > 0}<span>{bookmarkCount}</span>{/if}
  </Action>
</form>
