<script lang="ts">
  import type { RemoteFormIssue } from '@sveltejs/kit';
  import type { Snippet } from 'svelte';
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  interface Props extends HTMLTextareaAttributes {
    label: string;
    description?: string;
    error?: string;
    issues?: RemoteFormIssue[];
    addtion?: Snippet;
  }

  let { name, label, description, value = $bindable(), error, issues, addtion, ...rest }: Props = $props();
</script>

<div class="gap-y-xs flex w-full flex-col">
  <label class="font-semibold" for={name}>{label}</label>
  {#if description}<small class="text-subtle">{description}</small>{/if}
  {#if error}<small class="text-error">{error}</small>{/if}
  {#each issues as issue}
    <small class="text-error">{issue.message}</small>
  {/each}
  {#if addtion}{@render addtion()}{/if}
  <textarea
    class="bg-surface border-accent-alt focus-visible:border-accent h-[5em] border-2 p-1 focus-visible:outline-hidden"
    bind:value
    {name}
    {...rest}
  ></textarea>
</div>
