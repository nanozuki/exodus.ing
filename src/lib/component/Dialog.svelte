<script lang="ts">
  import { mergeAttrs } from 'melt';
  import { Dialog as MeltDialog } from 'melt/builders';
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';

  interface DialogProps {
    trigger: Snippet;
    content: Snippet<[close: () => void]>;
    labelledby: string;
  }

  const { trigger, content, labelledby }: DialogProps = $props();
  const dialog = new MeltDialog();
  let contentVersion = $state(0);

  // Recreate content after native close so discarded edits reset without interrupting focus on open.
  function resetContent() {
    contentVersion += 1;
  }

  function close() {
    dialog.open = false;
  }
</script>

<Button {...dialog.trigger}>
  {@render trigger()}
</Button>

<div {...dialog.overlay} class="overlay bg-muted/20 fixed inset-0 h-full w-full"></div>
<dialog
  {...mergeAttrs(dialog.content, { onclose: resetContent })}
  aria-labelledby={labelledby}
  class="dialog bg-surface px-l py-m gap-y-m"
>
  {#key contentVersion}
    {@render content(close)}
  {/key}
</dialog>

<style>
  .overlay {
    margin: 0;
    padding: 0;
    border: 0;
  }

  .dialog {
    /* Transforms would change the containing block of injected fixed-position autofill controls. */
    position: fixed;
    inset: 0;
    width: 80%;
    max-width: 30rem;
    max-height: calc(100dvh - 2rem);
    height: fit-content;
    margin: auto;
    color: inherit;
  }

  .dialog[open] {
    display: flex;
    flex-direction: column;
  }

  .dialog::backdrop {
    /* Keep the native backdrop hit target so outside clicks reach Melt’s dialog handler. */
    background: transparent;
  }
</style>
