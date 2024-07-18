<script lang="ts">
	import { format } from 'date-fns';
	const { data } = $props();
</script>

<svelte:head>
	<title>{data.article.title} - EXODUS</title>
	<meta name="og:title" content={`${data.article.title} - EXODUS`} />
</svelte:head>

<p class="design">
	<i>by</i>
	{data.article.username}
	<i>in</i>
	{format(data.article.createdAt, 'yyyy-MM-dd')}
</p>
{#if data.myself}
	<p>
		<a href="/a/{data.article.id}/edit">编辑文章</a>
	</p>
{/if}

<article>
	{@html data.file}
</article>
