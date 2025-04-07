<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  interface Props extends HTMLTextareaAttributes {
    field: string;
    label: string;
    value?: ReturnType<typeof $bindable<string>>;
    description?: string;
    error?: ReturnType<typeof $bindable<string>>;
    errors?: ReturnType<typeof $bindable<string[]>>;
  }

  let {
    field,
    label,
    description,
    error = $bindable(),
    errors = $bindable(),
    value = $bindable(),
    ...rest
  }: Props = $props();
</script>

<div class="flex flex-col gap-y-xs w-full">
  <label class="font-semibold" for={field}>{label}</label>
  {#if description}<small class="text-subtle">{description}</small>{/if}
  {#if error}<small class="text-error">{error}</small>{/if}
  {#if errors}<small class="text-error">{errors}</small>{/if}
  <textarea
    class="p-1 bg-surface border-2 border-accent-alt h-[5em] focus-visible:border-accent focus-visible:outline-hidden"
    name={field}
    bind:value
    {...rest}
  ></textarea>
</div>
