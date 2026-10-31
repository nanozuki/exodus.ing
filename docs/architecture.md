# Architecture and Development Conventions

Use this document to decide responsibility and dependency boundaries. Before
changing a module's interfaces or behavior, read its directory contract in
[shapes/](shapes/) for the concrete design.

## Responsibilities and Placement

| Area             | Responsibility                                                                                      | Location                                          |
| ---------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Models           | Shared business data and business functions without external dependencies.                          | `src/lib/models/`                                 |
| Database         | Connection construction, schema definitions, and storage row types.                                 | `src/lib/server/db/`                              |
| Repositories     | Database reads, writes, result mapping, and internal transactions.                                  | `src/lib/server/repositories/`                    |
| Use cases        | Business functions that require external capabilities and run on the server.                        | `src/lib/server/use-cases/`                       |
| Adapters         | Request-independent implementations of external capabilities.                                       | `src/lib/server/adapters/`                        |
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
- Perform database reads, writes, and result mapping in repositories. Provide
  one repository operation for related data that must be read consistently, then
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

### Data and Type Placement

Group model types by business concept. Models may represent records,
projections, aggregates, or compositions of other models. Use `Summary` for
general summary projections, such as `ArticleSummary` and `UserSummary`; reserve
presentation names such as `Card` for components. Projections serving a specific
role retain descriptive names such as `ArticleListItem` and `ArticleContent`.

Place a type used by only one function beside that function. Operation-specific
parameters may be declared inline; when defining a separate parameter type, name
it `XxxParams` and place it beside the repository function or use case that owns
it. Define operation-specific dependency and result types beside their use case,
and page- or component-specific types beside their remote function. Prefer
existing models, or compositions of them, for complex use-case results.

For example, invite statistics are an aggregate; `CreateArticleParams` belongs
beside the repository's `createArticle` function; a page's tabs and selected tab
belong beside its remote function.

Name Drizzle-inferred storage types `XxxRow`, such as `ArticleRow`, and keep
them in the database module. Repositories map these storage records into models.

## Use Cases

Implement exported use cases as standalone functions with the form
`foo(deps, params): Result`, or `Promise<Result>` for asynchronous operations.
Both `deps` and `params` are objects. Here, `Result` is a placeholder for the
operation's successful return type.

- `deps` declares only the external capabilities the operation needs, such as
  `db`, a DNS resolver, or a clock. Repositories are application functions:
  import them and pass the database instead of injecting a repository set.
  Acquire dependencies through this argument rather than a global service
  registry.
- `params` contains the data for this invocation, including an authenticated
  actor when needed.

When an operation needs the current time, accept a clock such as
`deps.now: () => Date`. Request entry points supply the clock adapter's `now`;
tests can supply a fixed clock. Read it once when related decisions need the
same instant, and use that value throughout the operation. Persistence
timestamps managed by database defaults or repository writes remain persistence
concerns.

## Request Boundaries and Remote Functions

Keep SvelteKit request and response handling at the request boundary: remote
functions for component calls, and hooks or route handlers for other entry
points. This includes `getRequestEvent()`, cookies, redirects, input parsing,
serialization, and remote-query refreshes. Entry points supply explicit
dependencies and parameters to use cases.

Remotes may directly call or compose repositories and use cases. Call a
repository when only data access and result mapping are needed; call a use case
when business decisions or workflows require external capabilities. A single
repository call can still require a use case. Keep component-specific
aggregation, display state, and form feedback in the remote.

For example, an article list remote parses pagination and calls a repository. An
edit remote parses form fields, obtains the trusted actor, calls an editing use
case, then maps its validation result or redirects. For domain verification, the
remote parses the URL; the use case resolves DNS and checks the TXT records.

### File Placement

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

### Initial Data and Pagination

Expose page and layout initial data through remote queries named `loadPageData`
and `loadLayoutData` in their respective remote files. Components consume these
queries for server rendering and client navigation; application data does not
use page or layout `load` exports. Pass route parameters, search parameters, or
the pathname explicitly when a query depends on them, and validate them as
untrusted inputs. Obtain the authenticated actor from trusted request context.

Each protected remote operation enforces its own authorization. A layout query
does not authorize later operations. Keep session validation and cookie refresh
in hooks, and refresh affected remote query data after mutations.

Choose pagination size directly in the owning remote function. Pass it to the
repository as pagination input and return the effective size to consumers
through `Paginated<T>`. Its fields are defined in the
[models contract](shapes/src=lib=models.md).

## Repositories

### Function Contract

Implement database operations as exported standalone functions with
`db: AppDatabase` as the first parameter.

These contracts apply to exported database operations. Pure utilities,
query-building helpers, and database initialization are outside their scope.

### Public Data Shapes

Repository operations act on models. Return domain models or combinations of
models, including projections, aggregates, arrays, and paginated results. The
`void` results of update and delete operations follow the contracts below.

Inputs describe an operation's needs and need not be models; use the
[type placement rules](#data-and-type-placement).

For a proposed public shape change, follow the shape skill's
[approval boundary](../.agents/skills/shape/SKILL.md#approval-boundary).
Existing approval covers implementation of the agreed contract. This applies
equally to named types, anonymous object types, and shapes derived with `Pick`
or `Omit`. Internal implementation types may be defined locally.

### Operation Names and Contracts

Start each operation name with its action and include the model or relationship
name. Use `By<Condition>` for lookup criteria and `<Relation>Of<Model>` for
relationships between tables.

The signatures below are naming templates. `Model` and `Relation` are
placeholders for concrete approved result types, not TypeScript type parameters.
Replace names and parameter types with the concrete types for the operation.
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
database operation. Propose exceptions through the same approval boundary.

### Transactions and Consistency

Manage transactions entirely inside repositories. Callers pass the database;
transaction contexts remain internal. Separate repository calls from a use case
or remote function do not promise a shared transaction.

Use one transaction for multiple database statements that must succeed or fail
as a unit. Include reads that must be consistent with the writes they govern. A
single SQL statement affecting multiple rows does not by itself require an
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

## Testing

Repository and use-case tests verify the observable behavior promised by their
shape contracts. For which testing files belong in shape, follow the skill's
[testing boundary](../.agents/skills/shape/README.md#tests-and-shared-test-infrastructure).
