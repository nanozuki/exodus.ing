<script lang="ts">
  import type { UserDomain } from '$lib/entities';
  import { newDialog } from '$lib/comps';
  import { melt } from '@melt-ui/svelte';

  const { data } = $props();

  const domains = $state(data.domains);
  let processing = $state(false);
  const { Dialog, dialogProps, open, close } = newDialog();

  const verifyDomain = async (index: number) => {
    processing = true;
    const domain = domains[index];
    // GET /api/domains/:domain will verify an unverified domain
    const response = await fetch(`/api/domains/${domain.domain}`);
    if (response.ok) {
      const domainResponse = (await response.json()) as UserDomain;
      if (domainResponse.verifiedAt) {
        domains[index] = domainResponse;
      }
    }
    processing = false;
  };

  const deleteDomain = async (index: number) => {
    processing = true;
    const domain = domains[index];
    // DELETE /api/domains/:domain will delete a domain
    const response = await fetch(`/api/domains/${domain.domain}`, { method: 'DELETE' });
    if (response.ok) {
      domains.splice(index, 1);
    }
    processing = false;
  };
</script>

<section>
  <h4>域名</h4>
  <form method="POST" action="?/add_domain">
    <p class="design">添加个人域名</p>
    <input type="text" name="domain" placeholder="example.com" required />
    <button type="submit">添加</button>
  </form>
  {#each domains as domain, index (domain.domain)}
    <div class="domain">
      <div class="info">
        <p>{domain.domain} {domain.verifiedAt ? '已验证' : '未验证'}</p>
        {#if !domain.verifiedAt}<p>{domain.verifyTxtRecord}</p>{/if}
      </div>
      {#if !domain.verifiedAt}
        <button disabled={processing} onclick={() => verifyDomain(index)}>验证</button>
      {/if}
      <button disabled={processing} use:melt={$open}>删除</button>
    </div>
    <Dialog title={'删除域名'} {dialogProps}>
      确认删除域名？相关文章不会被删除。
      <div class="dialog-actions">
        <button class="negative" use:melt={$close}>取消</button>
        <button class="positive" onclick={() => deleteDomain(index)}>删除</button>
      </div>
    </Dialog>
  {/each}
</section>

<style>
  section {
    max-width: 20rem;
  }
  .dialog-actions {
    display: flex;
    column-gap: 1rem;
    margin-top: 1rem;
    button {
      flex: 1;
    }
  }
</style>
