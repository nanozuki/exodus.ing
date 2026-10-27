// IDs run from the root to this record, including this record’s own ID.
export type IdPath = string[];

// Segments must already be safe to join; encoding performs no escaping or validation.
export function encodeIdPath(path: IdPath): string {
  return path.join('/') + '/';
}

// Repeated and trailing separators are tolerated.
export function decodeIdPath(path: string): IdPath {
  return path.split('/').filter(Boolean);
}

export type PathEncoded<T extends { path: IdPath }> = Omit<T, 'path'> & { path: string };

export type PathDecoded<T extends { path: string }> = Omit<T, 'path'> & { path: IdPath };

export function decodePathField<T extends { path: string }>(item: T): PathDecoded<T> {
  return { ...item, path: decodeIdPath(item.path) };
}

export function encodePathField<T extends { path: IdPath }>(item: T): PathEncoded<T> {
  return { ...item, path: encodeIdPath(item.path) };
}

export function getPathParent(path: IdPath): string | undefined {
  if (path.length < 2) return undefined;
  return path[path.length - 2];
}
