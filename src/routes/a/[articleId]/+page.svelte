<script lang="ts">
	import { format } from 'date-fns';
	import { compile, type File } from '$lib/markdown';
	import { onMount } from 'svelte';

	const { data } = $props();
	let article: File | undefined = $state(undefined);

	onMount(() => {
		compile(data.article.content).then((result) => {
			article = result;
		});
	});
</script>

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
	{#if article}
		{@html article}
	{/if}
</article>
