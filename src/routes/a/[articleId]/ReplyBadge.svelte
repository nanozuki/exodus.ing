<script lang="ts">
  import MdiReplyOutline from '~icons/mdi/reply-outline';
  import Action from '$lib/component/Action.svelte';

  interface ReplyBadgeProps {
    count: number;
  }
  const { count }: ReplyBadgeProps = $props();
</script>

<Action element="a" href="#reply-section">
  <MdiReplyOutline />
  <span>回应</span>
  {#if count > 0}<span>{count}</span>{/if}
</Action>
