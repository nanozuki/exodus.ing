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
<article>
	{#if article}
		{@html article}
	{/if}
</article>
