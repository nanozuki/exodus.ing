# src/lib/server/testing

Isolated PostgreSQL databases for repository integration tests. Each test
database is a clone made through the checkout-local provisioning lifecycle, so
tests exercise real SQL and internal transactions without connecting to the
development database. Application code must not import this test-only module.
Importing it performs no I/O.
