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

<div class="gap-y-xs flex w-full flex-col">
  <label class="font-semibold" for={field}>{label}</label>
  {#if description}<small class="text-subtle">{description}</small>{/if}
  {#if error}<small class="text-error">{error}</small>{/if}
  {#if errors}<small class="text-error">{errors}</small>{/if}
  <textarea
    class="bg-surface border-accent-alt focus-visible:border-accent h-[5em] border-2 p-1 focus-visible:outline-hidden"
    name={field}
    bind:value
    {...rest}
  ></textarea>
</div>
