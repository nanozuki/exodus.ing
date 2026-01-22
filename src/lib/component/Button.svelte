<script lang="ts">
  import { type Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { twMerge } from 'tailwind-merge';

  type Variant = 'normal' | 'primary' | 'danger' | 'accent';
  interface ButtonProps extends HTMLButtonAttributes {
    variant?: Variant;
    pending?: number;
    children: Snippet;
  }
  const {
    variant = 'normal',
    pending = 0,
    children,
    class: classProp,
    disabled: disabledProp,
    ...rest
  }: ButtonProps = $props();
  const disabled = $derived(pending > 0 || disabledProp);

  const colorClasses = {
    normal: 'bg-text/20 hover:bg-text/30 text-text border-text',
    primary: 'bg-link/20 hover:bg-link/30 text-link font-semibold border-link',
    danger: 'bg-error/20 hover:bg-error/30 text-error font-semibold border-error',
    accent: 'bg-accent/20 hover:bg-accent/30 text-accent font-semibold border-accent',
    disabled: 'bg-highlight-med text-muted border-muted cursor-not-allowed',
  };

  let colorClass = $derived.by(() => {
    if (disabled) return colorClasses.disabled;
    return colorClasses[variant];
  });
</script>

<button
  {...rest}
  class={twMerge(colorClass, 'w-full border-2 px-4 py-1 font-semibold ' + classProp)}
  {disabled}
  aria-busy={pending > 0}
>
  {@render children()}
</button>
