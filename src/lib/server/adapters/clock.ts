/**
 * Reads the current time. Use cases declare `now: Clock` in their `deps`; request entry points supply `now` below, and
 * tests supply a fixed clock.
 */
export type Clock = () => Date;

/** Returns the current time as a new `Date`; a use case reads it once when related decisions need the same instant. */
export const now: Clock = () => new Date();
