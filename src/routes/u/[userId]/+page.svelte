<script lang="ts">
	import { format } from 'date-fns';

	const { data, form } = $props();
	let usernameEditing = $state(false);
</script>

<h1>{data.user!.username}</h1>
{#if data.myself}
	{#if usernameEditing}
		{#if form?.error}
			<p class="error">{form?.error}</p>
		{/if}
		<form method="POST">
			<input type="text" name="username" value={form?.username} required />
			<button class="negative" type="button" onclick={() => (usernameEditing = false)}>取消</button>
			<button class="positive" type="submit">提交</button>
		</form>
	{:else}
		<div class="actions">
			<button class="positive" onclick={() => (usernameEditing = true)}>修改用户名</button>
			<a class="button" href="/a/new/edit">添加新文章</a>
		</div>
	{/if}
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
				<a href="/a/{article.articleId}/edit">编辑</a>
			{/if}
		</article>
	{/each}
</div>

<style>
	form {
		width: 15rem;
		display: grid;
		grid-template:
			'username username' auto
			'cancel submit' auto / 1fr 1fr;
		gap: 1rem;
	}
	p.error {
		color: var(--red);
	}
	form input {
		grid-area: username;
	}
	form button.negative {
		grid-area: cancel;
	}
	form button.positive {
		grid-area: submit;
	}

	div.actions {
		display: flex;
		column-gap: 1rem;
	}
	a.button {
		display: inline-block;
		line-height: 2rem;
		padding: 0 1rem;
		background-color: var(--green);
		color: var(--primary-bg);
		text-decoration: none;
	}

	div.article-list {
		display: flex;
		flex-direction: column;
		row-gap: 1rem;
	}
	article i {
		color: var(--teritary-fg);
	}
</style>
