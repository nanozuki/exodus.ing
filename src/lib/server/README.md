# src/lib/server

Runtime composition and the server layers. The registry initializes the database
and provider adapters from configuration; the subdirectories hold repositories,
use cases, adapters, and transport. Business operations live in use cases and
import neither the registry nor transport.
