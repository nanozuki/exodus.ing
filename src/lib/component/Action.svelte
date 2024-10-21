<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    href: string;
    children: Snippet;
  }
  const { href, children }: Props = $props();
</script>

<a role="button" {href}>{@render children()}</a>

<style>
  a {
    display: inline-flex;
    font-size: 1rem;
    padding: 0.125rem 0.5rem;
    text-decoration: none;
    align-items: center;
    color: var(--secondary-fg);
    border: 0.125rem solid var(--secondary-fg);
    border-radius: 0.5rem;
    gap: 0.125rem;
  }
</style>
