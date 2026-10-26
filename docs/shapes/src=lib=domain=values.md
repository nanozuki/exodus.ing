# src/lib/domain/values

Supply identity paths, author projections, pagination structures, and OAuth state data shared across application
consumers.

## Files

### `src/lib/domain/values/auth.ts`

#### `OAuthCookieDataSchema`

```typescript
export declare const OAuthCookieDataSchema: z.ZodObject<
  {
    state: z.ZodString;
    next: z.ZodOptional<z.ZodString>;
    signUp: z.ZodOptional<
      z.ZodObject<
        {
          username: z.ZodOptional<z.ZodString>;
          name: z.ZodOptional<z.ZodString>;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$strip
>;
```

Validate required string state and optional next/signup data. Object schemas strip unrecognized keys; string values have
no nonempty or URL constraints here.

#### `OAuthCookieData`

```typescript
export type OAuthCookieData = z.infer<typeof OAuthCookieDataSchema>;
```

#### `OAuthCookieDataInput`

```typescript
export type OAuthCookieDataInput = Omit<OAuthCookieData, 'state'>;
```

### `src/lib/domain/values/author.ts`

#### `Author`

```typescript
export interface Author {
  id: string;
  username: string;
  name: string;
}
```

### `src/lib/domain/values/id_path.ts`

#### `IdPath`

```typescript
export type IdPath = string[];
```

#### `encodeIdPath`

```typescript
export declare function encodeIdPath(path: IdPath): string;
```

Join segments with `/` and append a trailing slash. An empty path encodes as `/`; segment contents are not validated or
escaped.

#### `decodeIdPath`

```typescript
export declare function decodeIdPath(path: string): IdPath;
```

Split on `/` and discard empty segments, tolerating repeated or absent trailing separators.

#### `PathEncoded`

```typescript
export type PathEncoded<
  T extends {
    path: IdPath;
  },
> = Omit<T, 'path'> & {
  path: string;
};
```

#### `PathDecoded`

```typescript
export type PathDecoded<
  T extends {
    path: string;
  },
> = Omit<T, 'path'> & {
  path: IdPath;
};
```

#### `decodePathField`

```typescript
export declare function decodePathField<
  T extends {
    path: string;
  },
>(item: T): PathDecoded<T>;
```

Return a shallow copy with only `path` decoded to segments; leave the input object unchanged.

#### `encodePathField`

```typescript
export declare function encodePathField<
  T extends {
    path: IdPath;
  },
>(item: T): PathEncoded<T>;
```

Return a shallow copy with only `path` converted to its string representation; leave the input object unchanged.

#### `getPathParent`

```typescript
export declare function getPathParent(path: IdPath): string | undefined;
```

Return the penultimate segment, or `undefined` when fewer than two segments exist.

### `src/lib/domain/values/page.ts`

#### `Pagination`

```typescript
export interface Pagination {
  pageNumber: number;
  pageSize: number;
}
```

`pageNumber` is one-based. These interfaces impose no runtime validation; consumers and query boundaries determine
acceptable values.

#### `Paginated`

```typescript
export interface Paginated<T> {
  pageNumber: number;
  count: number;
  items: T[];
}
```

`count` is the total matching record count before pagination; `items` is the selected page. Grouping comment records can
produce fewer items than the page size.
