# src/lib/server

Runtime composition and request-boundary authentication support. The registry
initializes the database and provider adapters; request helpers in `auth.ts`
manage cookies, OAuth request data, post-sign-in redirect targets, and locals.
Business operations live in use cases and import neither the registry nor the
request helpers.
