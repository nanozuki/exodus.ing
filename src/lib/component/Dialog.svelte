<script lang="ts">
  import { createDialog, createSync, melt, type CreateDialogProps } from '@melt-ui/svelte';
  import type { Snippet } from 'svelte';

  interface DialogProps {
    trigger: Snippet;
    content: Snippet;
    open: ReturnType<typeof $bindable<boolean>>;
    dialogProps?: CreateDialogProps;
  }

  let { open = $bindable(false), ...props }: DialogProps = $props();

  const {
    elements: { portalled, overlay, content },
    states,
  } = createDialog(props.dialogProps || { role: 'alertdialog' });

  const sync = createSync(states);
  $effect(() => {
    sync.open(open, (value) => {
      open = value;
    });
  });
</script>

{@render props.trigger()}

{#if open}
  <div use:melt={$portalled}>
    <div use:melt={$overlay} class="bg-muted/20 fixed top-0 left-0 z-40 h-full w-full"></div>
    <div use:melt={$content} class="dialog bg-surface px-l py-m gap-y-m z-50 flex flex-col">
      {@render props.content()}
    </div>
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
