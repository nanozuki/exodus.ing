<script lang="ts">
	import { compile, type File } from '$lib/markdown';
	import { onMount } from 'svelte';

	let mode: 'editor' | 'previewer' = $state('editor');
	let article: string = $state('');
	let compiled: File | undefined = $state(undefined);
	let title = $derived.by(() => compiled?.data.meta?.title);

	let articleSnapshot = '';
	onMount(() => {
		setInterval(() => {
			if (!$state.is(article, articleSnapshot)) {
				articleSnapshot = article;
				compile(article).then((result) => {
					compiled = result;
				});
			}
		}, 1000);
	});
</script>

<h1 class="design">{title ? title : '无标题'}</h1>
<small>标题来自 frontmatter 里的 “title” 或者第一个一级标题。</small>

<div class="switch">
	<button
		class:activate={mode === 'editor'}
		onclick={() => {
			mode = 'editor';
		}}>编辑</button
	>
	<button
		class:activate={mode === 'previewer'}
		onclick={() => {
			mode = 'previewer';
		}}>预览</button
	>
</div>

<main>
	{#if mode === 'editor'}
		<textarea bind:value={article}></textarea>
	{:else if compiled}
		<article>
			{@html compiled}
		</article>
	{/if}
</main>

<style>
	div.switch {
		display: flex;
		border: 1px solid var(--green);
		margin: 1rem 0;
	}
	button {
		flex: 1;
		background-color: var(--secondary-bg);
	}
	button.activate {
		color: var(--primary-bg);
		background-color: var(--green);
		border-color: var(--green);
	}

	textarea {
		width: 100%;
	}
</style>
