import { getContext, hasContext, setContext } from 'svelte';

export type FormState = { submitting: boolean };
const formStateKey = 'formState';
export function setFormStateContext(state: FormState) {
  console.log('setFormStateContext', state);
  setContext(formStateKey, state);
}
export function getFormStateContext(): FormState | null {
  console.log('getFormStateContext');
  if (!hasContext(formStateKey)) {
    return null;
  }
  return getContext(formStateKey) as FormState;
}
