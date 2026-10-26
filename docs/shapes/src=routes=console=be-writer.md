# src/routes/console/be-writer

Render invitation redemption for readers who want author privileges, with form validation and operation feedback.

## Files

### `src/routes/console/be-writer/+page.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Submit a required inviteCode through FormState(acceptInviteCode); display schema issues and operation errors.
