import Dialog from './Dialog.svelte';
import Loading from './Loading.svelte';
import Logo from './Logo.svelte';

import { createDialog } from '@melt-ui/svelte';

export function newDialog({ defaultOpen = false } = {}) {
  const dialogProps = createDialog({ role: 'alertdialog', defaultOpen });
  return {
    Dialog,
    dialogProps,
    open: dialogProps.elements.trigger,
    close: dialogProps.elements.close,
  };
}

export { Loading, Logo };
