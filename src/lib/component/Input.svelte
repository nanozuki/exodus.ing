<script lang="ts">
  import type { RemoteFormIssue } from '@sveltejs/kit';
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends HTMLInputAttributes {
    label: string;
    description?: string;
    error?: string;
    issues?: RemoteFormIssue[];
  }

  let { name, label, description, value = $bindable(), error, issues, ...rest }: Props = $props();
</script>

<div class="gap-y-xs flex w-full flex-col">
  <label class="font-semibold" for={name}>{label}</label>
  <div class="gap-y-2xs flex w-full flex-col">
    <input
      class="bg-surface border-accent-alt focus-visible:border-accent border-2 p-1 leading-6 focus-visible:outline-hidden"
      bind:value
      {name}
      {...rest}
    />
    {#if description}<small class="text-subtle">{description}</small>{/if}
    {#if error}<small class="text-error">{error}</small>{/if}
    {#each issues as issue}
      <small class="text-error">{issue}</small>
    {/each}
  </div>
</div>
