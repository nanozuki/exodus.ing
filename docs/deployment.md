# Deployment

## Fly.io request origin

Read this guide when changing origin configuration or canonical redirects, or
diagnosing production CSRF failures.

The public request path is browser → Cloudflare → Fly Proxy → Node. The Fly
default domain also reaches the application directly through Fly Proxy.
Cloudflare and Fly.io enforce HTTPS for public access. See
[fly.toml](../fly.toml) for the repository-managed deployment settings.

### Origin configuration decision

Keep SvelteKit 3 `paths.origin` unset for this deployment. adapter-node 6 can
derive the public origin from `Host` and its default `https` protocol. The
observed proxy behavior requires no `PROTOCOL_HEADER`, `HOST_HEADER`, or
`PORT_HEADER` override. `APP_URL` supplies the application's canonical URL;
SvelteKit does not automatically use it as framework origin configuration.

In adapter-node 6, a fixed `paths.origin` also supplies the origin used to
construct `request.url`. Fixing it to the canonical domain would hide visits to
the Fly default domain from the application's origin comparison. See the
[adapter-node documentation](https://svelte.dev/docs/kit/adapter-node#Environment-variables-PROTOCOL_HEADER-HOST_HEADER-and-PORT_HEADER).

### Production observations

On 2026-10-31, temporary server-hook diagnostics added in
[PR #38](https://github.com/nanozuki/exodus.ing/pull/38) recorded these values
before the application's host redirect:

| Request field        | Via Cloudflare        | Via Fly default domain        |
| -------------------- | --------------------- | ----------------------------- |
| `request.url`        | `https://exodus.ing/` | `https://exodus-ing.fly.dev/` |
| `Host`               | `exodus.ing`          | `exodus-ing.fly.dev`          |
| `X-Forwarded-Proto`  | `https`               | `https`                       |
| `X-Forwarded-Host`   | absent                | absent                        |
| `Fly-Forwarded-Port` | `443`                 | `443`                         |

Visiting the Fly default domain first reached `https://exodus-ing.fly.dev/`,
then reached `https://exodus.ing/` after the application redirect. Both entry
paths preserved the requested hostname at the application boundary. These
observations came from the pre-migration deployment using SvelteKit 2.50.1 and
adapter-node 5.5.2; they establish proxy behavior, not SvelteKit 3 remote-form
compatibility or redirect status/path preservation.

### Revalidation

After changing the proxy chain, HTTPS policy, or adapter behavior:

1. Capture the fields in the table before host redirects for both public entry
   paths. Restrict diagnostics to these fields and strip query strings to keep
   OAuth credentials out of logs. Record the observations, then remove the
   temporary diagnostics.
2. Verify a real same-origin remote form submission succeeds without a CSRF 403.
3. Verify the Fly default domain redirects with the intended status and
   preserves the path and query string.

The SvelteKit 3 deployment requires steps 2 and 3 even if the proxy chain is
unchanged. Revalidation passes when the form submission succeeds, the redirect
matches the intended status and URL, and any required header observations are
recorded with temporary diagnostics removed.
