/** IDs from the root of the reply chain to this record, ending with this record's own ID. */
export type IdPath = string[];

/**
 * Joins segments with `/` and appends a trailing slash; an empty path encodes as `/`. Segments are neither validated
 * nor escaped, so they must already be safe to join.
 */
export function encodeIdPath(path: IdPath): string {
  return path.join('/') + '/';
}

/** Splits on `/` and drops empty segments, so repeated, leading, or missing trailing separators are tolerated. */
export function decodeIdPath(path: string): IdPath {
  return path.split('/').filter(Boolean);
}

export type PathEncoded<T extends { path: IdPath }> = Omit<T, 'path'> & { path: string };

export type PathDecoded<T extends { path: string }> = Omit<T, 'path'> & { path: IdPath };

/** Returns a shallow copy with only `path` decoded; the input is unchanged. */
export function decodePathField<T extends { path: string }>(item: T): PathDecoded<T> {
  return { ...item, path: decodeIdPath(item.path) };
}

/** Returns a shallow copy with only `path` encoded; the input is unchanged. */
export function encodePathField<T extends { path: IdPath }>(item: T): PathEncoded<T> {
  return { ...item, path: encodeIdPath(item.path) };
}

/** Returns the parent's ID, the second-to-last segment, or `undefined` for a path shorter than two segments. */
export function getPathParent(path: IdPath): string | undefined {
  if (path.length < 2) return undefined;
  return path[path.length - 2];
}
