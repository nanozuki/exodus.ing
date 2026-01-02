<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  interface Props extends HTMLTextareaAttributes {
    label: string;
    description?: string;
    error?: string;
    errors?: string;
  }

  let { name, label, description, value = $bindable(), error, errors, ...rest }: Props = $props();
</script>

<div class="gap-y-xs flex w-full flex-col">
  <label class="font-semibold" for={name}>{label}</label>
  {#if description}<small class="text-subtle">{description}</small>{/if}
  {#if error}<small class="text-error">{error}</small>{/if}
  {#if errors}<small class="text-error">{errors}</small>{/if}
  <textarea
    class="bg-surface border-accent-alt focus-visible:border-accent h-[5em] border-2 p-1 focus-visible:outline-hidden"
    bind:value
    {name}
    {...rest}
  ></textarea>
</div>
