<script lang="ts">
  import MdiTextBoxEditOutline from '~icons/mdi/text-box-edit-outline';
  import Action from '$lib/component/Action.svelte';
  import type { User } from '$lib/models/user';
  import type { Article } from '$lib/models/article';

  interface EditBadgeProps {
    user: User | null;
    article: Article;
  }

  const { user, article }: EditBadgeProps = $props();
</script>

{#if user && user.id === article.author.id}
  <Action element="a" href={`/a/${article.id}/edit`}>
    <MdiTextBoxEditOutline />
    编辑
  </Action>
{/if}
