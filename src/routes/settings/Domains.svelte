<script lang="ts">
  import type { UserDomain } from '$lib/entities';

  interface DomainsProps {
    domains: UserDomain[];
  }

  const { domains }: DomainsProps = $props();
</script>

<section>
  <h3>个人网站</h3>
  <form method="POST" action="?/add_domain">
    <input type="text" name="domain" placeholder="example.com" required />
    <button type="submit">添加</button>
  </form>
  <ul>
    {#each domains as domain}
      <li>
        {domain.domain}
        {#if !domain.verifiedAt}
          <button>验证</button>
        {:else}
          <div></div>
        {/if}
        <button>删除</button>
      </li>
    {/each}
  </ul>
</section>

<style>
  section {
    max-width: 20rem;
  }
  form {
    display: grid;
    grid-template-columns: 1fr max-content;
    column-gap: 1rem;
  }
  ul {
    padding-left: 0;
  }
  li {
    margin: 1rem 0;
    display: grid;
    grid-template-columns: 1fr max-content max-content;
    column-gap: 1rem;
  }
</style>
