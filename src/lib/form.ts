import type { ZodObject, ZodRawShape, z } from 'zod';

export type Form<Data extends object> = {
  data: Partial<Data>;
  error?: string;
  errors?: {
    [K in keyof Data]?: string;
  };
};

export function parseForm<Shape extends ZodRawShape>(
  formData: FormData,
  schema: ZodObject<Shape>,
): Form<z.infer<typeof schema>> {
  type Data = z.infer<typeof schema>;

  const raw: Record<string, FormDataEntryValue | null> = {};
  for (const key of Object.keys(schema.shape)) {
    raw[key] = formData.get(key);
  }
  const result = schema.safeParse(raw);
  if (result.success) {
    return { data: result.data };
  }
  const errors: { [K in keyof Data]?: string } = {};
  for (const issue of result.error.issues) {
    if (issue.path.length > 0) {
      const key = issue.path[0] as keyof Data; // zod confirmed.
      errors[key] = issue.message;
    }
  }
  return {
    data: raw as Partial<Data>, // If user submit imcompatible data, return it won't be harmful.
    errors,
    error: 'Invalid form submission',
  };
}

export function mergeFormData<Data extends object>(data: Data, form?: Form<Data>): Data {
  const merged: Data = { ...data };
  if (form?.data) {
    for (const key in form.data) {
      const value = form.data[key];
      if (value !== undefined) {
        merged[key] = value;
      }
    }
  }
  return merged;
}
