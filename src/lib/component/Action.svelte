<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

  type BaseActionProps = {
    ['class']?: string;
    children: Snippet;
  };
  type ActionProps =
    | ({ element: 'a' } & BaseActionProps & HTMLAnchorAttributes)
    | ({ element: 'button' } & BaseActionProps & HTMLButtonAttributes);

  const { element, children, class: outerClass, ...rest }: ActionProps = $props();
</script>

<svelte:element
  this={element}
  class={'flex gap-x-1 items-center text-accent-alt bg-accent-alt/20 hover:bg-accent-alt/30 py-1 px-2 ' +
    (outerClass || '')}
  {...rest}
>
  {@render children()}
</svelte:element>
