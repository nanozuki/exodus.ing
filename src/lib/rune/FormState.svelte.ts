import type { RemoteForm, RemoteFormInput } from '@sveltejs/kit';
import { catchError } from './errors';

type FormProps<Input extends RemoteFormInput, Output> = ReturnType<RemoteForm<Input, Output>['enhance']>;

// FormState manage the props and error of a remote form
export class FormState<Input extends RemoteFormInput, Output> {
  error: string | null;
  props: FormProps<Input, Output>;

  constructor(form: RemoteForm<Input, Output>) {
    this.error = $state<string | null>(null);
    this.props = form.enhance(async ({ form, submit }) => {
      try {
        await submit();
        form.reset();
      } catch (e) {
        const err = catchError(e);
        this.error = err.message;
      }
    });
  }
}
