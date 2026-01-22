<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import { twMerge } from 'tailwind-merge';

  type Variant = 'normal' | 'primary' | 'danger' | 'accent' | 'disabled';
  interface ButtonLinkProps extends HTMLAnchorAttributes {
    variant?: Variant;
    children: Snippet;
  }
  const { variant = 'normal', class: classProp, children, ...rest }: ButtonLinkProps = $props();
  const colorClass = {
    normal: 'bg-text/20 hover:bg-text/30 text-text border-text',
    primary: 'bg-link/20 hover:bg-link/30 text-link font-semibold border-link',
    danger: 'bg-error/20 hover:bg-error/30 text-error font-semibold border-error',
    accent: 'bg-accent/20 hover:bg-accent/30 text-accent font-semibold border-accent',
    disabled: 'bg-highlight-med text-muted border-muted cursor-not-allowed',
  };
</script>

<a {...rest} class={twMerge(colorClass[variant], 'w-full border-2 px-4 py-1 font-semibold ' + classProp)}>
  {@render children()}
</a>
