<script lang="ts">
  import type { UserDomain } from '$lib/entities';

  interface DomainsProps {
    verifiedDomains: UserDomain[];
    unverifiedDomains: UserDomain[];
  }

  const { verifiedDomains, unverifiedDomains }: DomainsProps = $props();
</script>

<section>
  <h4>网站</h4>
  <form method="POST" action="?/add_domain">
    <input type="text" name="domain" placeholder="example.com" required />
    <button type="submit">添加</button>
  </form>
  <h5>已验证</h5>
  <ul>
    {#each verifiedDomains as domain}
      <li>
        {domain.domain}
        <button>删除</button>
      </li>
    {/each}
  </ul>
  <h5>未验证</h5>
  <ul>
    {#each unverifiedDomains as domain}
      <li>
        <div>
          <p>{domain.domain}</p>
          <p>DNS Record: {domain.verifyTxtRecord}</p>
        </div>
        <button>验证</button>
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
