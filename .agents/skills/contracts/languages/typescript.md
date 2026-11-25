# TypeScript

- A unit test file pairs with its source by name: `article.ts` ↔
  `article.test.ts`.
- The view shows signatures and doc comments, never function bodies, so a
  contract fact passed in a callback goes in the doc comment. A Drizzle table
  states the primary keys, unique constraints, and indexes its third argument
  declares, with what each guarantees or serves.
- Group a declaration's tests as
  `describe('<declaration>') > it('<behaviour>')`, two levels only. A class
  member's declaration name is `Class.member`.

```ts
describe('saveMarkdownArticle', () => {
  it('rejects a title longer than 100 characters without writing', async () => {
    // ...
  });
});

// Covers: createInviteCode, acceptInviteCode
it('lets an invited user join with an unused code', async () => {
  // ...
});
```
