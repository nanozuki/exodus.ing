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
    <div class="dialog" use:melt={$content}>
      <h2 class="design" use:melt={$title}>{props.title}</h2>
      {#if props.description}<p class="warn" use:melt={$description}>{props.description}</p>{/if}
      {@render props.children()}
    </div>
  </div>
{/if}
