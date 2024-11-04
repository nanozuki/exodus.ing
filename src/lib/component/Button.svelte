<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  type Variant = 'normal' | 'primary' | 'danger' | 'disabled';
  interface ButtonProps extends HTMLButtonAttributes {
    variant?: Variant;
    children: Snippet;
  }
  const { variant = 'normal', children, ...rest }: ButtonProps = $props();
  const colorClass = {
    normal: 'bg-text/20 hover:bg-text/30 text-text border-text',
    primary: 'bg-link/20 hover:bg-link/30 text-link font-semibold border-link',
    danger: 'bg-danger/20 hover:bg-danger/30 text-danger font-semibold border-error',
    disabled: 'bg-highlight-med text-muted border-highlight-med cursor-not-allowed',
  };
</script>

<button
  {...rest}
  class={colorClass[variant] + ' w-full font-semibold px-4 py-1 border-2'}
  disabled={variant === 'disabled'}
>
  {@render children()}
</button>
