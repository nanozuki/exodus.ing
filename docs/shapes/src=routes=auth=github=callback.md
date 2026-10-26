# src/routes/auth/github/callback

Complete GitHub sign-in or account creation, persist a session, set its authentication cookie, and return to the
requested destination.

## Files

### `src/routes/auth/github/callback/+server.ts`

#### `GET`

```typescript
export declare function GET(request: RequestEvent): Promise<Response>;
```

Complete adapter callback verification; look up GitHub identity and create a new User when missing, using requested
signup username/name or provider defaults. Reject usernames beginning with @; otherwise rely on storage constraints for
uniqueness. Create a session, set the auth cookie, and respond 302 to next when it starts with `/`, otherwise `/`. This
accepts protocol-relative URLs. Convert failures through catchError/throwAppError. User creation and session creation
are not one transaction.
