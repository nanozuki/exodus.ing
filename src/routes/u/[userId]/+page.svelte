<script lang="ts">
	import { format } from 'date-fns';

	const { data } = $props();
	console.log('data: ', data);
	let usernameEditing = $state(false);
</script>

<h1>{data.user!.username}</h1>
{#if data.myself}
	{#if usernameEditing}
		<form method="POST">
			<input type="text" name="username" required />
			<button type="submit">提交</button>
		</form>
	{:else}
		<button class="positive" onclick={() => (usernameEditing = true)}>修改用户名</button>
	{/if}
	<a href="/account/new_article"><h4>添加新文章</h4></a>
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
			{#if data.myself}
				<a href="/account/edit/{article.articleId}">编辑</a>
			{/if}
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
