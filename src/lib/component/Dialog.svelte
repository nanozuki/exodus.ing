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
    <div class="fixed top-0 left-0 w-full h-full z-40 bg-muted/20" use:melt={$overlay}></div>
    <section class="dialog bg-surface z-50 px-l py-m flex flex-col gap-y-m" use:melt={$content}>
      <h2 use:melt={$title}>{props.title}</h2>
      {#if props.description}<p use:melt={$description}>{props.description}</p>{/if}
      {@render props.children()}
    </section>
  </div>
{/if}

<style>
  .dialog {
    position: fixed;
    width: 80%;
    max-width: 30rem;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
  }
</style>
