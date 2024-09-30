import type { Clock } from '$lib/domain/adapters';

export const clock: Clock = {
  now: () => new Date(),
};
