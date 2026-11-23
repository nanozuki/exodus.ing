# src/routes/auth

The sign-in page: separate GitHub OAuth registration and login forms that carry
the requested `next` destination through the OAuth round trip. Outside
production builds it also links to the simulated login in `testing/`.
