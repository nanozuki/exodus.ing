export type IdPath = string[];

export function encodeIdPath(path: IdPath): string {
  return path.join('/') + '/';
}

export function decodeIdPath(path: string): IdPath {
  return path.split('/').filter(Boolean);
}

type Encoded<T extends { path: IdPath }> = Omit<T, 'path'> & { path: string };
type Decoded<T extends { path: string }> = Omit<T, 'path'> & { path: IdPath };

export function decodePathField<T extends { path: string }>(item: T): Decoded<T> {
  return { ...item, path: decodeIdPath(item.path) };
}

export function encodePathField<T extends { path: IdPath }>(item: T): Encoded<T> {
  return { ...item, path: encodeIdPath(item.path) };
}
