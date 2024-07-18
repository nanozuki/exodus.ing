<script lang="ts">
	import { format } from 'date-fns';

	const { data } = $props();
</script>

{#if data.articles.length === 0}
	<p>
		Nothing can save you except writing<br />
		by Charles Bukowski
	</p>
{/if}

<h4>文章列表</h4>

<div class="article-list">
	{#each data.articles as article}
		<article>
			<a href="/a/{article.articleId}">
				<h2 class="design">{article.title}</h2>
			</a>
			<p class="design">
				<i>by</i>
				{article.username}
				<i>in</i>
				{format(article.createdAt, 'yyyy-MM-dd')}
			</p>
		</article>
	{/each}
</div>

<style>
	div.article-list {
		display: flex;
		flex-direction: column;
		row-gap: 1rem;
	}
	article i {
		color: var(--teritary-fg);
	}
</style>
