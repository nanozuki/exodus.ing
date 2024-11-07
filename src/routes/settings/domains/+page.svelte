<script lang="ts">
  import type { UserDomain } from '$lib/domain/entities/user_domain';
  import Input from '$lib/component/Input.svelte';
  import Button from '$lib/component/Button.svelte';
  import Dialog from '$lib/component/Dialog.svelte';

  const { data } = $props();

  const domains = $state(data.domains);
  let processing = $state(false);
  let open = $state(false);
  let deleteIndex: number | null = $state(null);

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

  const openDeleteDialog = (index: number) => {
    deleteIndex = index;
    open = true;
  };

  const deleteDomain = async () => {
    if (deleteIndex === null) return;
    processing = true;
    const domain = domains[deleteIndex];
    // DELETE /api/domains/:domain will delete a domain
    const response = await fetch(`/api/domains/${domain.domain}`, { method: 'DELETE' });
    if (response.ok) {
      domains.splice(deleteIndex, 1);
    }
    processing = false;
    open = false;
  };
</script>

<svelte:head>
  <title>域名设置 - Exodus</title>
  <meta property="og:title" content="域名设置" />
</svelte:head>

<p>添加个人域名并通过 DNS 验证后，可以将域名中的文章添加到本站。</p>

<form class="flex flex-col gap-y-xs" method="POST">
  <Input label="添加新域名" field="domain" type="text" placeholder="example.com" required />
  <Button type="submit">添加</Button>
</form>
{#each domains as domain, index (domain.domain)}
  <div class="border-t last:border-b border-border flex flex-col gap-y-s py-m">
    <div>
      {#if domain.verifiedAt}
        <span class="px-2xs break-all bg-link text-base">已验证</span>
      {:else}
        <span class="px-2xs break-all bg-error text-base">未验证</span>
      {/if}
      <span>{domain.domain}</span>
      {#if !domain.verifiedAt}
        <div class="text-accent">
          <p class="text-sm">请添加以下 TXT DNS 记录以验证域名：</p>
          <p class="text-sm font-mono break-all">{domain.verifyTxtRecord}</p>
        </div>
      {/if}
    </div>
    <div class="flex gap-x-m">
      {#if !domain.verifiedAt}
        <Button variant="primary" disabled={processing} onclick={() => verifyDomain(index)}>验证</Button>
      {/if}
      <Dialog bind:open>
        {#snippet trigger()}
          <Button variant="danger" disabled={processing} onclick={() => openDeleteDialog(index)}>删除</Button>
        {/snippet}
        {#snippet content()}
          <div>
            <h3>删除域名</h3>
            <p class="text-error">确认删除 {domains[deleteIndex!].domain} 吗？相关文章不会被删除。</p>
          </div>
          <div class="grid grid-rows-1 grid-cols-2 gap-x-m">
            <Button
              onclick={() => {
                open = false;
              }}>取消</Button
            >
            <Button variant="danger" onclick={deleteDomain}>删除</Button>
          </div>
        {/snippet}
      </Dialog>
    </div>
  </div>
{/each}
