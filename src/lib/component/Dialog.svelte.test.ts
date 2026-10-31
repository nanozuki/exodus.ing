import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DialogTest from './Dialog.test.svelte';

test('Content closes the dialog and reopening discards edits', async () => {
  const screen = await render(DialogTest);
  const trigger = screen.getByRole('button', { name: 'Edit username' });
  const dialog = screen.getByRole('dialog', { includeHidden: true });
  await trigger.click();
  await expect.element(screen.getByRole('dialog', { name: 'Change username' })).toBeVisible();
  await expect.element(screen.getByRole('textbox', { name: 'Username' })).toHaveFocus();
  await screen.getByRole('textbox', { name: 'Username' }).fill('discarded');
  await screen.getByRole('button', { name: 'Cancel' }).click();
  await expect.element(dialog).not.toBeVisible();
  await expect.element(trigger).toHaveFocus();
  await trigger.click();
  await expect.element(dialog).toBeVisible();
  await expect.element(screen.getByRole('textbox', { name: 'Username' })).toHaveValue('carol');
});
