# src/routes/auth

The sign-in page: one GitHub button that carries the requested `next`
destination through the OAuth round trip. A new identity continues to `sign-up/`
after the callback. Outside production builds the page also links to the
simulated login in `testing/`.
