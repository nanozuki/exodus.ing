<script lang="ts">
	import './styles.css';

	const { children, data } = $props();
</script>

<!-- web fonts -->
<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Serif:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Noto+Sans+SC:wght@100..900&family=Noto+Serif+SC:wght@200..900&display=swap"
		rel="stylesheet"
	/>
	<title>EXODUS</title>
</svelte:head>

<header>
	<svg
		fill="currentColor"
		xmlns="http://www.w3.org/2000/svg"
		width="32"
		height="32"
		viewBox="0 0 24 24"
		><path
			d="M3 1H1v18h18V1zm14 2v14H3V3zm4 18H5v2h18V5h-2zM15 5H5v2h10zM5 9h10v2H5zm7 4H5v2h7z"
		/></svg
	>
	<a class="design" href="/"><h1 class="design">EXODUS</h1></a>
	<div style="flex: 1"></div>
	{#if data.user}
		<a href="/account">{data.user.username}</a>
	{:else}
		<a href="/auth">注册/登录</a>
	{/if}
</header>

<main>
	{@render children()}
</main>

<style>
	header,
	main {
		max-width: 40rem;
		margin: 0 1.5rem;
	}
	@media (min-width: 43rem) {
		header,
		main {
			margin: 0 auto;
		}
	}
	header {
		display: flex;
		align-items: center;
		column-gap: 0.5rem;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}
</style>
