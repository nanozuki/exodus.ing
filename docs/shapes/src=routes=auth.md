# src/routes/auth

Render separate registration and login forms using GitHub OAuth and preserve the requested return destination.

## Files

### `src/routes/auth/+page.svelte`

#### `default`

```typescript
declare const component: Component<Record<string, never>>;
export default component;
```

Read optional next from the current URL. Submit independent registration and login forms through FormState, with
optional signup username/name and issue feedback. Show simulated-login navigation only when PROD is false; the remote
independently checks its environment.
