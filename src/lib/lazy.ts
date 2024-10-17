type Loader<T extends object> = {
  [K in keyof T]: () => T[K];
};

export function createLazyProxy<T extends object>(loader: Loader<T>): T {
  const cache: Partial<T> = {};
  const handler: ProxyHandler<Loader<T>> = {
    get: (target, prop) => {
      if (prop in target) {
        const key = prop as keyof T;
        return cache[key] ?? (cache[key] = loader[key]());
      }
      return undefined;
    },
  };

  return new Proxy(loader, handler) as T;
}
