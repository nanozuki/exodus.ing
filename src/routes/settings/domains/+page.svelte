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
    dialogProps.states.open.set(false);
  };
</script>

<p>添加并通过 DNS 验证个人域名后，可以将域名中的文章添加到本站。</p>

<form method="POST">
  <h5 class="design">添加个人域名</h5>
  <div class="input">
    <input type="text" name="domain" placeholder="example.com" required />
    <button type="submit">添加</button>
  </div>
</form>
{#each domains as domain, index (domain.domain)}
  <div class="domain">
    <div class="info">
      <span class:verified={domain.verifiedAt} class:unverified={!domain.verifiedAt}>
        {domain.verifiedAt ? '已验证' : '未验证'}
      </span>
      <span>{domain.domain}</span>
    </div>
    {#if !domain.verifiedAt}
      <div class="hint">
        <small>请添加以下 TXT 记录到 DNS 以验证域名：</small>
        <small class="record">{domain.verifyTxtRecord}</small>
      </div>
    {/if}
    <div class="actions">
      {#if !domain.verifiedAt}
        <button disabled={processing} onclick={() => verifyDomain(index)}>验证</button>
      {/if}
      <button disabled={processing} use:melt={$open}>删除</button>
    </div>
  </div>
  <Dialog title={'删除域名'} {dialogProps}>
    确认删除域名？相关文章不会被删除。
    <div class="dialog-actions">
      <button class="negative" use:melt={$close}>取消</button>
      <button class="positive" onclick={() => deleteDomain(index)}>删除</button>
    </div>
  </Dialog>
{/each}

<style>
  form {
    display: flex;
    flex-direction: column;
    row-gap: 0.5rem;
    margin: 1rem 0;

    .input {
      display: flex;
      column-gap: 0.5rem;
    }
    input {
      display: block;
      flex: 4;
    }
    button {
      display: block;
      flex: 1;
    }
  }
  .dialog-actions {
    display: flex;
    column-gap: 1rem;
    margin-top: 1rem;
    button {
      flex: 1;
    }
  }
  .domain {
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    row-gap: 0.5rem;
    padding: 1rem 0;
  }
  .domain:last-child {
    border-bottom: 1px solid var(--border-color);
  }
  .record {
    font-family: var(--monospace);
    word-break: break-all;
  }
  span {
    padding: 0 0.25rem;
    word-break: break-all;
  }
  span.verified {
    background-color: var(--green);
    color: var(--primary-bg);
  }
  span.unverified {
    background-color: var(--red);
    color: var(--primary-bg);
  }
  div.actions {
    display: flex;
    column-gap: 1rem;
    button {
      flex: 1;
    }
  }
</style>
