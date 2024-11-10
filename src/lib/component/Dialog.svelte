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
    <div use:melt={$overlay} class="fixed top-0 left-0 w-full h-full z-40 bg-muted/20"></div>
    <div use:melt={$content} class="dialog bg-surface z-50 px-l py-m flex flex-col gap-y-m">
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
