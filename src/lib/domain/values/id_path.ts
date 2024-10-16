export type IdPath = string[];

export function encodeIdPath(path: IdPath): string {
  return path.join('/') + '/';
}

export function decodeIdPath(path: string): IdPath {
  return path.split('/').filter(Boolean);
}
