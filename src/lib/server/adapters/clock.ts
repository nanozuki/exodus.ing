/** Use cases declare `clock: Clock` in their `deps`; tests supply a fixed clock. */
export interface Clock {
  /** Returns the current time; a use case reads it once when related decisions need the same instant. */
  now(): Date;
}

/**
 * The production implementation, returning a new `Date` on each call; request entry points supply it as `deps.clock`.
 */
export const clock: Clock = {
  now() {
    return new Date();
  },
};
