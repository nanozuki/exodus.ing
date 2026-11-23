/**
 * Returns the current time as a new `Date`. Request entry points supply it as `deps.now`; a use case reads it once
 * when related decisions need the same instant.
 */
export function now(): Date {
  return new Date();
}
