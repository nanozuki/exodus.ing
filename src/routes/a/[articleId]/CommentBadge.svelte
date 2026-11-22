<!--
  @component
  A comment action linking to `#reply-section`, the article-response section; shows `count` when it is positive.
-->
<script lang="ts">
  import MdiCommentTextOutline from '~icons/mdi/comment-text-outline';
  import Action from '#lib/component/Action.svelte';

  interface CommentBadgeProps {
    count: number;
  }

  const { count }: CommentBadgeProps = $props();
</script>

<Action element="a" href="#reply-section">
  <MdiCommentTextOutline />
  <span>评论</span>
  {#if count > 0}<span>{count}</span>{/if}
</Action>
