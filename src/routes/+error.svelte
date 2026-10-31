<script lang="ts">
  import { page } from '$app/state';
  import { errorTagTitle } from '#lib/errors.js';
</script>

<h1>Error: {page.status}</h1>
{#if page.error}
  <p>
    {#if page.error.detail}
      {errorTagTitle[page.error.detail.tag]}
    {:else if page.status === 404}
      未找到
    {:else if page.status >= 500}
      服务器错误
    {:else}
      请求错误
    {/if}
  </p>
  <small>{page.error.message}</small>
{:else}
  <p>Unknown error occurred.</p>
{/if}

<style>
  small {
    font-family: var(--font-mono);
  }
</style>
