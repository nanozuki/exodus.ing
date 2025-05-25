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

<div class="gap-y-xs flex w-full flex-col">
  <label class="font-semibold" for={field}>{label}</label>
  <div class="gap-y-2xs flex w-full flex-col">
    <input
      class="bg-surface border-accent-alt focus-visible:border-accent border-2 p-1 leading-6 focus-visible:outline-hidden"
      name={field}
      bind:value
      {...rest}
    />
    {#if description}<small class="text-subtle">{description}</small>{/if}
    {#if error}<small class="text-error">{error}</small>{/if}
  </div>
</div>
