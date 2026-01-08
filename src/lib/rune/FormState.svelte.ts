import { catchError } from '$lib/errors';
import type { RemoteForm, RemoteFormInput } from '@sveltejs/kit';

type FormStateOpts = {
  afterSubmit?: () => void;
};

// FormState manage the props and error of a remote form
export class FormState<Input extends RemoteFormInput, Output> {
  error: string | undefined;
  props: ReturnType<RemoteForm<Input, Output>['enhance']>;

  constructor(
    form: RemoteForm<Input, Output>,
    public opts?: FormStateOpts,
  ) {
    this.error = $state(undefined);
    this.props = form.enhance(async ({ form, submit }) => {
      try {
        await submit();
        if (this.opts?.afterSubmit) {
          this.opts.afterSubmit();
        }
        form.reset();
      } catch (e) {
        const err = catchError(e);
        this.error = err.message;
      }
    });
  }
}
