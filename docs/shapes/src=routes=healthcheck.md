# src/routes/healthcheck

Expose HTTP server availability for Fly's internal health checks without
querying external services.

## Files

### `src/routes/healthcheck/+server.ts`

#### `GET`

```typescript
export declare const GET: RequestHandler;
```

Return HTTP 200 with an empty body. The server hook lets this path resolve
without canonical-origin redirects or authentication.
