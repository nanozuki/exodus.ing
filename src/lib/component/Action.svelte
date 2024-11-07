<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  type ActionBaseProps = {
    variant?: 'normal' | 'primary' | 'danger' | 'disabled';
    className?: string;
    children: Snippet;
  };

  type ActionProps =
    | ({ element: 'button' } & ActionBaseProps & HTMLButtonAttributes)
    | ({ element: 'a' } & ActionBaseProps & HTMLAnchorElement);
</script>
