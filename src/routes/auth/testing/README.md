# src/routes/auth/testing

Simulated login for development and tests: pick any stored user and sign in as
them without GitHub. Both remote operations throw FORBIDDEN in a production
build unless the mode is `test`.
