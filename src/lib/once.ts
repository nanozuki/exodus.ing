export type Once<T> = () => T;

export function once<T>(fn: () => T): Once<T> {
  let value: T | undefined;
  return () => {
    if (value === undefined) {
      value = fn();
    }
    return value;
  };
}
