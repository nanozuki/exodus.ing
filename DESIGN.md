# Project Design Document

## Pages, Layouts

Follow the structure with SvelteKit, the project is divided into pages. Each
pages have a Layouts stack, and contains Components. The backend should follow
the same structure.

Here are Pages and Layouts:

```plaintext
- $RootLayout
  - Home (/)
  - Article (/a/:slug)
    - ArticleEditor (/a/:slug/edit)
  - Auth (/auth)
  - Settings (/settings)
    - $SettingsLayout
      - ProfileSettings (/settings/profile)
      - AccountSettings (/settings/account)
      - DomainsSettings (/settings/domains)
  - User (/u/:username)
```

## Backend Design

The backend structure should be like this:

```plaintext
- src/lib
  - domain/
    - entities/
      - Article.ts
    - values/
      - ArticleListItem.ts
    - services/
      - ArticleListService.ts
  - server/
    - interfaces/
      - pages/
        - HomePage.ts
    - infra/
      - repositories/
        - ArticleListRepository.ts
```

### Structure

There are four parts in the backend:

#### `interfaces`

The interface of the backend, provide the methods that organized by pages and
layouts. Each layouts and pages have a corresponding backend module. Each
`load`, `formAction`, and `api` function converts the request and response to
the request and use one of the `interface` function.

#### `services`

There are several services class containes use cases of the backend, it provides
the business logic that the interface needs. Each service class should follow
the "Single Responsibility" principle, specifically:

- One service should only operate one entity or value object.
- One service should only have one dependency.

The dependency should be defined as an interface, and injected by the DI.

#### `infra`

This part is the implementation of the services' dependencies.

#### `domain`

This part contains the entity and value object definition of domain.

---

`server` is a special directory in SvelteKit, the code in `server` can not used
in the client side.
