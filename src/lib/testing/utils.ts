import { throwError } from '$lib/errors';

export function notProd(): boolean {
  console.log({
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
  });
  return import.meta.env.MODE === 'staging' || !import.meta.env.PROD;
}

export function ensureNotProd(operation: string): void {
  console.log({
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
  });
  if (import.meta.env.MODE !== 'staging' && import.meta.env.PROD) {
    throwError('FORBIDDEN', { operation });
  }
}
