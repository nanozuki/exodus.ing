<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import { twMerge } from 'tailwind-merge';

  type BaseActionProps = {
    ['class']?: string;
    processing?: boolean;
    children: Snippet;
  };
  type ActionProps =
    | ({ element: 'a' } & BaseActionProps & HTMLAnchorAttributes)
    | ({ element: 'button' } & BaseActionProps & HTMLButtonAttributes);

  const { element, processing, children, class: classProp, ...rest }: ActionProps = $props();
  const colorClass = $derived(processing ? 'bg-muted/20 hover:bg-muted/30' : 'bg-accent-alt/20 hover:bg-accent-alt/30');
</script>

<svelte:element
  this={element}
  class={twMerge(`flex gap-x-1 items-center text-accent-alt ${colorClass} py-1 px-2`, classProp)}
  {...rest}
>
  {@render children()}
</svelte:element>
