# src/lib/rune

Adapt SvelteKit remote forms for component consumers with reactive error feedback and post-submit reset behavior.

## Files

### `src/lib/rune/FormState.svelte.ts`

Supporting types and declarations used by the public signatures below (not additional exports):

```typescript
type FormStateOpts = {
  afterSubmit?: () => void;
};
```

#### `FormState`

```typescript
export declare class FormState<Input extends RemoteFormInput, Output> {
  opts?: FormStateOpts | undefined;
  error: string | undefined;
  props: ReturnType<RemoteForm<Input, Output>['enhance']>;
  constructor(form: RemoteForm<Input, Output>, opts?: FormStateOpts | undefined);
}
```

The constructor installs remote-form enhancement. On fulfilled submission, call `opts.afterSubmit` if present, reset the
HTML form, and clear `error`. On a caught failure, use `catchError` and expose its message; non-Error values rethrown by
`catchError` still propagate. `props` is spread onto the form, and `error` uses Svelte reactive state.
