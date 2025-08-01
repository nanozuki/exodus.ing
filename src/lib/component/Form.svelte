<script lang="ts">
  import { type Snippet } from 'svelte';
  import type { HTMLFormAttributes } from 'svelte/elements';
  import { enhance } from '$app/forms';
  import { setFormStateContext, type FormState } from '$lib/context.svelte';

  const props: HTMLFormAttributes & {
    children: Snippet;
  } = $props();

  let formState = $state<FormState>({ submitting: false });
  setFormStateContext(formState);
  const preSubmit = () => {
    formState.submitting = true;
    return () => {
      formState.submitting = false;
    };
  };
</script>

<form {...props} use:enhance={preSubmit}>
  {@render props.children()}
</form>
