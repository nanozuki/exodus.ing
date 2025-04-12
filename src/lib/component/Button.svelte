<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { twMerge } from 'tailwind-merge';

  type Variant = 'normal' | 'primary' | 'danger' | 'disabled';
  interface ButtonProps extends HTMLButtonAttributes {
    variant?: Variant;
    children: Snippet;
  }
  const { variant = 'normal', children, class: classProp, ...rest }: ButtonProps = $props();
  const colorClass = {
    normal: 'bg-text/20 hover:bg-text/30 text-text border-text',
    primary: 'bg-link/20 hover:bg-link/30 text-link font-semibold border-link',
    danger: 'bg-error/20 hover:bg-error/30 text-error font-semibold border-error',
    disabled: 'bg-highlight-med text-muted border-highlight-med cursor-not-allowed',
  };
</script>

<button
  {...rest}
  class={twMerge(colorClass[variant], 'w-full border-2 px-4 py-1 font-semibold', classProp)}
  disabled={variant === 'disabled'}
>
  {@render children()}
</button>
