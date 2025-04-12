<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends HTMLInputAttributes {
    field: string;
    label: string;
    value?: ReturnType<typeof $bindable>;
    description?: string;
    error?: string;
  }

  let { field, label, description, error, value = $bindable(), ...rest }: Props = $props();
</script>

<div class="flex flex-col gap-y-xs w-full">
  <label class="font-semibold" for={field}>{label}</label>
  {#if description}<small class="text-subtle">{description}</small>{/if}
  {#if error}<small class="text-error">{error}</small>{/if}
  <input
    class="p-1 bg-surface border-2 border-accent-alt focus-visible:border-accent focus-visible:outline-none leading-6"
    name={field}
    bind:value
    {...rest}
  />
</div>
