# Architecture and Development Conventions

## Responsibilities and Placement

| Area             | Responsibility                                                                                      | Location                                          |
| ---------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Models           | Shared business data and business functions without external dependencies.                          | `src/lib/models/`                                 |
| Repositories     | Database reads, writes, result mapping, and internal transactions.                                  | `src/lib/server/repositories/`                    |
| Use cases        | Business functions that require external capabilities and run on the server.                        | `src/lib/server/use-cases/`                       |
| Remote functions | Adapt frontend component inputs and outputs, and organize component-specific data and interactions. | Beside the page, layout, or component they serve. |

### Business Function Boundaries

Models and use cases are peers in the business logic layer. First identify the
business functionality a module needs to provide, then choose its location based
on external dependencies and callers.

Implement a business operation's calculations and decisions directly in that
operation. Extract another function only for a concrete scenario boundary,
required layer boundary, or actual reuse. Export only functions that the owning
module must provide to its callers. Purity alone does not justify extracting a
helper or a model function; a pure calculation used solely by one use case stays
directly in that operation.

### External Dependencies

An external dependency is a capability used to observe or change the outside
world: a database, network access, a clock, a random-number generator, or access
to environment variables or request context. Supplied values are input data;
capabilities obtain data or cause effects.

A pure function computes the same result from the same input values without
observable side effects. Deterministic library calls can be pure; an import or
an asynchronous signature alone does not establish an external dependency.

- Calling `now()` or `new Date()` to obtain the current time uses an external
  dependency. Comparing a session's expiration with a supplied `currentTime`
  value is pure.
- Reading `process.env` uses an external dependency. Calculating a quota from
  supplied counts and configuration values is pure.
- Calling a DNS resolver uses an external dependency. Checking supplied TXT
  records for a verification code is pure.

### Business Rules and Data Access

- Place a business function in models when it needs no external capabilities and
  is needed by client code or shared across modules. Keep models independent of
  server infrastructure, request context, and frontend components.
- Place business functions requiring external capabilities in use cases, with
  database access performed through repository functions.
- Perform database reads, writes, and result mapping in repositories. Provide one
  repository operation for related data that must be read consistently, then
  apply business calculations outside that operation.

For example:

- **Shared permission check:** `hasPermission(roles, permission)` belongs in
  models when both client components and server operations use it. It decides
  from supplied roles and permissions without external dependencies.
- **Invite quota query:** `getInviteQuota({ db }, { userId })` belongs in use
  cases. It reads the required statistics consistently through a repository and
  calculates the quota directly in the same function.
- **Session validation:** `validateSession({ db, now }, { sessionId })` belongs
  in use cases. It loads the session, compares its expiration with the injected
  clock's current time, and decides whether to delete or renew it through
  repository operations. The expiration comparison stays in this operation.

### Request and Component Adaptation

Keep SvelteKit request and response handling at the request boundary: remote
functions for component calls, and hooks or route handlers for other entry
points. This includes `getRequestEvent()`, cookies, redirects, input parsing,
serialization, and remote-query refreshes. These entry points call use cases with
explicit dependencies and parameters, leaving use cases independent of pages
and request context.

Remote functions may directly call or compose repository functions and use cases.
Call a repository directly when only data access and result mapping are needed;
use a use case when business decisions or workflows require external
capabilities. A single repository call can still require a use case. Keep
component-specific aggregation, display state, and form feedback in the remote.

For example:

- **Article list:** the remote parses pagination input, calls a repository, and
  adapts its result for the component.
- **Page aggregation:** the remote combines independent queries and use-case
  results with page-specific display state.
- **Article edit form:** the remote parses form fields, obtains the authenticated
  actor from trusted request context, and calls the editing use case. It then
  refreshes queries or redirects to the article.
- **Domain verification:** the remote parses a URL; a use case queries DNS and
  checks the returned TXT records against the verification code in that
  operation.

### Data and Type Placement

Group model types by business concept. Models may represent records, projections,
aggregates, or compositions of other models.

Define operation-specific dependency, parameter, and result types beside their use case, and
page- or component-specific types beside their remote function. Prefer existing
models, or compositions of them, for complex use-case results.

For example, `ArticleCard` is a reusable projection and invite statistics are an
aggregate; editing-operation parameters belong beside the editing use case; a
page's tabs and selected tab belong beside its remote function.

## Use Cases

Implement exported use cases as standalone functions with the form
`foo(deps, params): Result`, or `Promise<Result>` for asynchronous operations.
Both `deps` and `params` are objects. Here, `Result` is a placeholder for the
operation's successful return type.

- `deps` declares only the external capabilities the operation needs, such as
  `db`, a DNS resolver, or a clock. Prefer a database dependency over an injected
  repository set; import repository functions and pass them the database. Acquire
  dependencies through this argument rather than a global service registry.
- `params` contains the data for this invocation, including an authenticated
  actor when needed.

For example, an article-editing operation can use
`editArticle({ db }, { actor, articleId, content })`; domain verification can use
`verifyDomainOwnership({ resolveTxt }, { url, verificationCode })`.

When an operation needs the current time, accept a clock such as
`deps.now: () => Date`. Read it once when related decisions need the same instant,
and use that value throughout the operation.

## Remote File Placement

| Consumer                           | Remote file                                                                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| A page                             | `page.remote.ts` beside its `+page.svelte`, for example `src/routes/a/[articleId]/page.remote.ts`. |
| A layout                           | `layout.remote.ts` beside its `+layout.svelte`.                                                    |
| A component                        | `<ComponentName>.remote.ts` beside `<ComponentName>.svelte`, for example `ArticleList.remote.ts`.  |
| Multiple components in one feature | A business-named file such as `bookmarks.remote.ts` in their shared feature directory.             |

Page-level coordination belongs to the page's remote file; interactions owned by
a component belong to that component's remote file. Locate shared remote
functions by feature ownership so components can use them without depending on
an unrelated page.

## Repositories

### Function Contract

Implement database operations as exported standalone functions with
`db: AppDatabase` as the first parameter.

These contracts apply to exported database operations. Pure utilities,
query-building helpers, and database initialization are outside their scope.

### Public Data Shapes

Use existing or explicitly user-approved models for exported operation inputs
and results. Before introducing or changing a public data shape, discuss its
purpose and structure with the user. This applies equally to named types,
anonymous object types, and shapes derived with utilities such as `Pick` or
`Omit`. Internal implementation types may be defined locally.

### Operation Names and Contracts

Start each operation name with its action and include the model or relationship
name. Use `By<Condition>` for lookup criteria and `<Relation>Of<Model>` for
relationships between tables.

The signatures below are naming templates. `Model` and `Relation` are placeholders
for concrete approved result types, not TypeScript type parameters. Replace names
and parameter types with the concrete types for the operation.
Arrays and `Paginated<T>` wrap approved types without defining new models.

| Template                              | Return type                    | Contract                                                                                  |
| ------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------- |
| `getModelByCondition(db, condition)`  | `Promise<Model>`               | Return the required result; throw the project's `NOT_FOUND` HTTP error (404) when absent. |
| `findModelByCondition(db, condition)` | `Promise<Model \| null>`       | Return the optional result, or `null` when absent.                                        |
| `getRelationOfModel(db, id)`          | `Promise<Relation>`            | Return the required related result; throw `NOT_FOUND` when absent.                        |
| `findRelationOfModel(db, id)`         | `Promise<Relation \| null>`    | Return the optional related result, or `null` when absent.                                |
| `getModels(db, params)`               | `Promise<Model[]>`             | Return the complete matching collection without pagination.                               |
| `getRelationsOfModel(db, id)`         | `Promise<Relation[]>`          | Return the complete matching relationship collection without pagination.                  |
| `listModels(db, params, page)`        | `Promise<Paginated<Model>>`    | Return a page of matching results using the existing pagination types.                    |
| `listRelationsOfModel(db, id, page)`  | `Promise<Paginated<Relation>>` | Return a page of matching related results.                                                |
| `createModel(db, createParams)`       | `Promise<Model>`               | Create and return the model.                                                              |
| `updateModel(db, updateParams)`       | `Promise<void>`                | Execute the Drizzle update without additional existence checks.                           |
| `deleteModel(db, deleteParams)`       | `Promise<void>`                | Execute the Drizzle delete without additional existence checks.                           |

Use singular names for individual results and plural names for collections.
Interpret plurality semantically: a name such as `Stats` may describe one result
object rather than an array.

`get` collections return `[]` when empty; `list` collections return an empty
paginated result. An empty collection alone does not establish that its owning
entity is absent. Complete-collection operations must not silently truncate
results with a limit.

Use these action prefixes and contracts for every new or modified exported
database operation. Discuss operations that do not fit with the user before
implementing them.

### Transactions and Consistency

Manage transactions entirely inside repositories. Callers pass the database;
transaction contexts remain internal. Separate repository calls from a use case
or remote function do not promise a shared transaction.

Use one transaction for multiple database statements that must succeed or fail
as a unit. Include reads that must be consistent with the writes they govern.
A single SQL statement affecting multiple rows does not by itself require an
additional transaction. When related reads require a consistent snapshot, choose
the query and transaction behavior inside the repository to provide it.

Keep related persistence changes consistent, such as updating an article's
comment count when inserting a comment. Base dependent changes on the records
actually affected: deleting no records must not decrement a related count.

### Error Handling

Wrap the complete body of every exported database operation with the existing
`wrap` helper. Use the exported function name as the operation label. Internal
helpers are covered by the exported operation's wrapper and do not require
separate wrapping.

Throw expected HTTP errors inside `wrap`; let the helper preserve those errors
and normalize unexpected failures.
