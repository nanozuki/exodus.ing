# TypeScript

- A unit test file pairs with its source by name: `article.ts` ↔
  `article.test.ts`.
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
