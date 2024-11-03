<script lang="ts">
  import type { ArticleCard } from '$lib/domain/entities/article';

  const { article }: { article: ArticleCard } = $props();
</script>

<div class="text-subtle gap-x-2xs bg-quote-odd px-2">
  <a class="text-hint hover:text-palette-iris inline" href={`/u/${article.authorUsername}`}>
    {article.authorName}
  </a>
  的
  <a class="font-serif font-bold inline" href={`/a/${article.id}`}>
    {article.title}
  </a>
</div>
