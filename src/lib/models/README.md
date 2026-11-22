# src/lib/models

Shared business records, projections, aggregates, and pure functions used by
client and server modules, grouped by business concept.

Models neither obtain external capabilities nor perform observable effects,
including on import. They import no server infrastructure, SvelteKit request
APIs, or component code.

Other directories own related types:

- Repository-specific SQL, row types, transaction mechanisms, and operation
  parameters belong to repositories.
- Use-case dependency, parameter, and result types, and business calculations
  such as the invitation quota, sit beside their use case.
- Page-only projections such as `ArticleDetail` and `CommentView`, and page-size
  choices, belong to remote functions and route handlers.
- Cookie transport data and cookie writers belong to the server request-boundary
  helper.
