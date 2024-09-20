<script lang="ts">
  import { createDialog, melt } from '@melt-ui/svelte';
  import type { Snippet } from 'svelte';

  interface DialogProps {
    title: string;
    description?: string;
    children: Snippet;
    dialogProps: ReturnType<typeof createDialog>;
  }

  let props: DialogProps = $props();

  const {
    elements: { portalled, overlay, content, title, description },
    states: { open },
  } = props.dialogProps;
</script>

{#if $open}
  <div use:melt={$portalled}>
    <div class="overlay" use:melt={$overlay}></div>
    <section class="dialog" use:melt={$content}>
      <h2 use:melt={$title}>{props.title}</h2>
      {#if props.description}<p use:melt={$description}>{props.description}</p>{/if}
      {@render props.children()}
    </section>
  </div>
{/if}

<style>
  div.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 50;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 0.5rem;
  }
  section.dialog {
    background-color: var(--secondary-bg);
    position: fixed;
    z-index: 50;
    width: 80%;
    max-width: 20rem;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
    padding: 0 1rem 1rem 1rem;
  }
</style>
