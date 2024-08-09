<script lang="ts">
  import { page } from '$app/stores';
</script>

<h1>Error: {$page.status}</h1>
<p>{$page.error?.message}</p>
<small>{$page.error?.key}</small>
<small>{$page.error?.context}</small>

<style>
  small {
    font-family: var(--monospace);
  }
</style>
