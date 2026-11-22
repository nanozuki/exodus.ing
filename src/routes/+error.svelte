<!--
  @component
  The application error page. Shows the HTTP status and error message from `$app/state.page`, titled by the business
  error's tag when `detail` exists and otherwise by status (404: 未找到, 5xx: 服务器错误, others: 请求错误). Without an
  error, shows the unknown-error text.
-->
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
