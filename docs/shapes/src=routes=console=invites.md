# src/routes/console/invites

Render invitation quota, unused codes, inviter, and invitees for authors,
including creation, deletion, and copy controls.

## Files

### `src/routes/console/invites/+page.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Await loadPageData({}). Show optional welcome text, inviter relationship, quota,
unused codes, and invitees. Pass each Relation.user to UserBadge and display its
invitedAt relationship timestamp. Offer creation only for positive quota. Delete
by submitted code; copy via navigator.clipboard and mark the last copied code.
Clipboard failures are not handled locally. Remotes refresh the projection after
writes.

### `src/routes/console/invites/page.remote.ts`

SvelteKit remote entry point. Validate request inputs and obtain trusted actors
at this boundary; preserve the framework query refresh, form fields,
enhancement, and pending APIs. Pass explicit capabilities to use cases or call
repositories directly for data access.

#### `loadPageData`

```typescript
export declare const loadPageData: RemoteQueryFunction<
  Record<string, never>,
  {
    inviter: Relation | undefined;
    invitees: Relation[];
    unusedCodes: InviteCodeSummary[];
    quota: number;
  }
>;
```

Accept an empty object and require CreateArticle. Concurrently query inviter,
invitees, unused codes, and getInviteQuota. Map the repository's missing inviter
null to undefined to preserve the page output. The quota's three statistics
share a snapshot, but the four page sections do not promise a common snapshot.

#### `createInviteCode`

```typescript
export declare const createInviteCode: RemoteForm<void, void>;
```

Require CreateArticle, then call the createInviteCode use case with database and
trusted actor. The use case calculates quota; the repository atomically checks
the supplied statistics before insertion. Refresh console invite data on
success. A changed statistics snapshot rejects with the documented retry
message.

#### `deleteInviteCode`

```typescript
export declare const deleteInviteCode: RemoteForm<
  {
    code: string;
  },
  void
>;
```

Require CreateArticle and nonempty code. Call deleteInviteCode directly with the
actor-scoped DeleteInviteCodeParams, then refresh console invite data.
