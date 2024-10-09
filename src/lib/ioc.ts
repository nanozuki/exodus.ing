import type { Awaitable } from 'vitest';

type Providers<T> = {
  [K in keyof T]?: () => Awaitable<T[K]>;
};

export class Container<Deps, Tags extends string[]> {
  private providers: Map<Tags[keyof Tags], Providers<Deps>> = new Map();

  constructor() {}

  provide<K extends keyof Deps, T extends Tags[keyof Tags]>(
    tag: T,
    token: K,
    provider: () => Awaitable<Deps[K]>,
  ) {
    const providers: Providers<Deps> = this.providers.get(tag) || {};
    providers[token] = provider;
    this.providers.set(tag, providers);
  }

  async resolve<K extends keyof Deps, T extends Tags[keyof Tags]>(
    tag: T,
    token: K,
  ): Promise<Deps[K]> {
    const providers = this.providers.get(tag);
    if (!providers) {
      throw new Error(`No providers found for ${String(tag)}`);
    }
    const provider = providers[token];
    if (!provider) {
      throw new Error(`No provider found for ${String(token)}`);
    }
    return await provider();
  }
}
