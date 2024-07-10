<script lang="ts">
	import './styles.css';

	const { children } = $props();
</script>

<div>
	{@render children()}
</div>

<style>
	div {
		max-width: 40rem;
		margin: 0 1.5rem;
	}
	@media (min-width: 43rem) {
		div {
			margin: 0 auto;
		}
	}
</style>
