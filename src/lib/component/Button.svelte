<script lang="ts">
  import { getFormStateContext } from '$lib/context.svelte';
  import { type Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { twMerge } from 'tailwind-merge';

  type Variant = 'normal' | 'primary' | 'danger' | 'disabled';
  interface ButtonProps extends HTMLButtonAttributes {
    variant?: Variant;
    children: Snippet;
  }
  const { variant = 'normal', children, class: classProp, disabled: disabledProp, ...rest }: ButtonProps = $props();
  const colorClasses = {
    normal: 'bg-text/20 hover:bg-text/30 text-text border-text',
    primary: 'bg-link/20 hover:bg-link/30 text-link font-semibold border-link',
    danger: 'bg-error/20 hover:bg-error/30 text-error font-semibold border-error',
    disabled: 'bg-highlight-med text-muted border-highlight-med cursor-not-allowed',
  };

  let disabled = $derived.by(() => {
    if (variant === 'disabled') return true;
    if (disabledProp) return true;
    if (rest.type === 'submit') {
      let formState = getFormStateContext();
      if (formState && formState.submitting) {
        return true;
      }
    }
    return false;
  });
  let colorClass = $derived.by(() => {
    if (disabled) return colorClasses.disabled;
    return colorClasses[variant];
  });
</script>

<button {...rest} class={twMerge(colorClass, 'w-full border-2 px-4 py-1 font-semibold ' + classProp)} {disabled}>
  {@render children()}
</button>
