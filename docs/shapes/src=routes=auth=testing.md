# src/routes/auth/testing

Render the development/test simulated-login selector; its remote operations enforce environment restrictions.

## Files

### `src/routes/auth/testing/+page.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Await listTestingUsers and show each returned user as a submit button with roles. Pass next through when it starts with
`/`, otherwise `/`. Submit through FormState; the remote performs environment enforcement.
