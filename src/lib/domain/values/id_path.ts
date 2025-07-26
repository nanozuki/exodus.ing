// IdPath stores replies in a tree structure.
// Format of IdPath is "<id1>/", "<id1>/<id2>/", "<id1>/<id2>/<id3>/", etc.
export type IdPath = string[];

export function encodeIdPath(path: IdPath): string {
  return path.join('/') + '/';
}

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
