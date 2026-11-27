# src/lib/server/adapters

Request-independent capabilities: GitHub OAuth, DNS TXT lookup, the clock, and
random value generation. Adapters do not import SvelteKit request or cookie
types. Request parsing, OAuth state-cookie validation, and session cookies
belong to `src/lib/server/transport/`; account and session decisions belong to
use cases.
