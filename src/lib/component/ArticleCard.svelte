<script lang="ts">
  import UserBadge from './UserBadge.svelte';
  import type { ArticleSummary } from '#lib/models/article.js';

  const { article }: { article: ArticleSummary } = $props();
</script>

<div class="text-subtle gap-x-2xs bg-quote-odd px-2">
  <UserBadge user={article.author} />
  的
  <a class="inline font-serif font-bold" href={`/a/${article.id}`}>
    {article.title}
  </a>
</div>
