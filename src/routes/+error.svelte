<script lang="ts">
  import { page } from '$app/state';
  import { errorTagTitle } from '$lib/errors';
</script>

<h1>Error: {page.status}</h1>
{#if page.error}
  <p>{errorTagTitle[page.error.tag]}</p>
  <small>{page.error.message}</small>
{:else}
  <p>Unknown error occurred.</p>
{/if}

<style>
  small {
    font-family: var(--font-mono);
  }
</style>
