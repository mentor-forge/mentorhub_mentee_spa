# Mentor Hub — Mentee SPA

## Current State
Guidance for LLM Code Assistants - NOTE: We are currently pre-release. At this time, no changes should consider backward compatibility. Likewise, while we anticipate versioning releases in the future at this point, no consideration should be given to bumping any versions beyond managing the internal api_utils spa_utils dependencies. We are in a rapid iteration phase where features can be deprecated and removed without pause. When working in this repo we should keep our eyes out for potential re-usable code that could be migrated to spa_utils. This code should be implemented locally, and issues opened in the api_utils repo when it is time to migrate code.

UI Components should stick to Vuetify styling, and leverage re-usable input components from SPA utils when possible. If a spa_utils component need to be updated, the code can be copied to this repo, edited, tested, and migrated to the utils repo like new re-usable components are.

## Prerequisites
- Mentor Hub [Developers Edition](https://github.com/mentor-forge/mentorhub/blob/main/CONTRIBUTING.md)
- Developer [SPA Standard Prerequisites](https://github.com/mentor-forge/mentorhub/blob/main/DeveloperEdition/standards/spa_standards.md)

## Quick Start

```sh
## Just run the service
npm run service 
```

| Service | Port | URL |
|---------|------|-----|
| Developer Edition login (IdP) | **8080** | `http://127.0.0.1:8080/login.html` |
| Mentee SPA (welcome / ALB — **supported browser entry**) | **8080** | `http://<host>:8080/mentee/` |
| Mentee SPA (Vite dev or container — **direct-port debugging only**) | **8394** | `http://localhost:8394/mentee/` |
| Mentee API | **8393** | this SPA's nginx at `/mentee/api/` (and `/api/` for direct-port debug) |

> [!WARNING]
> `npm run dev` and `npm run service` both bind host port **8394** and cannot run at the same time.

The supported browser entry is `http://<host>:8080/mentee/` through Developer Edition welcome / ALB. `http://localhost:8394/mentee/` is for Cypress, OpenAPI, and debugging only. API calls from the app use `/mentee/api/` and reach `mentee_api` through this SPA's nginx.

`npm run dev` serves the app at `http://localhost:8394/mentee/`.

### In-App Route Table

Vue route `path` strings stay unprefixed. Vite `base: '/mentee/'` prefixes the browser URL.

| Browser URL | Vue Path | Page |
|---|---|---|
| `http://localhost:8394/mentee/` | `/` | redirect → `/journey` |
| `http://localhost:8394/mentee/journey` | `/journey` | `JourneyEditPage.vue` (caller-scoped journey detail) |
| `http://localhost:8394/mentee/resource/{id}` | `/resource/:id` | `ResourceViewPage.vue` (Discovery resource card target) |
| `http://localhost:8394/mentee/path/{id}` | `/path/:id` | `PathViewPage.vue` (Discovery path card target) |
| `http://localhost:8394/mentee/config` | `/config` | `AdminPage.vue` (Settings host: Token / Config Items / Versions / Enumerators; `admin` role required). Hamburger Settings stays on this origin (no `:8080` rewrite). |
| `http://localhost:8394/mentee/admin` | `/admin` | alias of `/config` |

## Developer Commands

```sh
## install dependencies (run `mh` first for CodeArtifact auth)
npm ci

## install Cypress binaries
npx cypress install

## package code for deployment
npm run build 

## run Vite dev server on http://localhost:8394/mentee/ (assumes API is running)
npm run dev 

## run unit tests
npm run test

## run unit tests with coverage
npm run test:coverage

## run unit tests with UI
npm run test:ui

## run Cypress E2E tests
npm run cypress

## run Cypress E2E tests headlessly
npm run cypress:run

## de down and start db + api containers
npm run api 

## de down and start db + api + spa containers and open 
npm run service 

## open page in the browser
npm run open

## Build SPA docker container locally (run `mh` first)
npm run container
```

## Architecture Overview

```
src/
  api/              # API client layer (types.ts, client.ts)
  components/       # App-specific UI components (admin components)
  pages/            # Route-level components (journey, path, and resource detail pages)
  composables/      # App-specific composables (useConfig, useRoles wrapper); auth from spa_utils
  stores/           # Pinia stores (UI state only)
  router/           # Vue Router configuration
  plugins/          # Vuetify plugin configuration
```

This SPA has no CardGrid list dashboards. Collection browsing lives on Discovery (`/discovery/paths`, `/discovery/resources`). This repo keeps the caller-scoped journey detail page plus the path and resource detail pages that Discovery cards deep-link into.

**Note**: This template uses `@mentor-forge/mentorhub_spa_utils@1.0.3` for reusable components, composables, and utilities. See the [mentorhub_spa_utils README](../mentorhub_spa_utils/README.md) for complete documentation on available components (`PageFrame`, `CardGrid`, `MhCard`, `DataCard`, typed editors, `ListPageSearch`), composables (`useResourceList`, `useErrorHandler`, `useRoles`), and utilities (`formatDate`, `validationRules`). Token-tab `display_name` (`admin-token-display-name-display`) and PageFrame chrome `nav-profile-name-display` are owned by spa_utils 1.0.3 — this SPA does not map or fall back a local token display name.

## Key Implementation Patterns

### Authentication
- JWT tokens stored in localStorage (`access_token`, `token_expires_at`)
- Auth (`useAuth`, `redirectToIdpLogin`, `bootstrapAuthFromUrl`) from `@mentor-forge/mentorhub_spa_utils`; see `src/initAuth.ts`
- Sign-in uses IdP / URL hash (`bootstrapAuthFromUrl` from spa_utils); APIs are not used as a login surface
- Router guards protect routes requiring authentication

### API Client
- Located in `src/api/client.ts`
- All API calls include JWT token from localStorage
- Error handling via `ApiError` class
- Type-safe with TypeScript interfaces in `src/api/types.ts`

### Data Fetching
- Uses TanStack Query (Vue Query) for server state management
- Query keys follow pattern: `['resource', id]` or `['resources']`
- Mutations invalidate related queries on success
- Example: `useQuery({ queryKey: ['control', id], queryFn: () => api.getControl(id) })`

### Reusable Components and Composables
This template uses components and composables from `@mentor-forge/mentorhub_spa_utils@1.0.3`:
- **Shell**: `PageFrame` is the navigation shell (app bar, role-gated hamburger drawer, profile link, and IdP logout). Local nav config is disallowed — do not pass `navItems`, URL maps, ALB origin, or extra drawer slots. The only host prop is `pageTitle="Mentee"`, matching the other journey SPAs. The compiled 1.0.3 hamburger catalog is Home, Resources, and Paths for any authenticated user; Plans is **mentor**; Notifications, Events, and Settings are **admin-only**. Settings uses `hostingConfigHref()` and lands on this SPA’s `/mentee/config` on the hosting origin (no `:8080` rewrite). `/mentee/admin` is an alias of `/config`. Products, Customer, and Customer Members are **not** hamburger rows. When the JWT `display_name` claim is present, PageFrame chrome shows it next to the avatar (`nav-profile-name-display`) with no fallback to `name` / `given_name` / `email` / `user_id` / `sub`. Logout is owned by spa_utils (`logout()` then `redirectToIdpLogin(buildJourneyUrl('discovery'))` → `/discovery/`).
- **Components**: `CardGrid`, `MhCard`, `DataCard`, typed editors (`WordEditor`, `SentenceEditor`, `EnumEditor`, `EnumArrayEditor`, `BreadcrumbDisplay`), and `ListPageSearch`. Prefer `DataCard` + typed editors for view/edit forms. `AutoSaveField` is a compatibility wrapper for legacy pages; `AutoSaveSelect` remains available where runtime enumerators have not yet migrated.
- **Composables**: `useResourceList`, `useErrorHandler`, `useRoles`, `provideEditorConfig`
- **Utilities**: `formatDate`, `validationRules`

See the [mentorhub_spa_utils README](../mentorhub_spa_utils/README.md) for complete documentation and usage examples.

### Component Architecture
- **App Shell**: `PageFrame` wraps `router-view` inside the host `v-app`. Title markup lives in spa_utils (`page-frame-title`); the host passes the static `Mentee` title.
- **Pages**: Own routing, data fetching, and mutations. Pass data + callbacks to components.
- **Components**: App-specific components (admin components). Reusable components come from `spa_utils`.
- **Composables**: App-specific logic (authentication, config). Reusable composables come from `spa_utils`.
- **Stores**: UI-only state (loading, error messages, etc.)

## Testing

### Unit Tests
- Uses Vitest for unit testing
- Test coverage target: 90%
- Tests cover: API client, composables, and components
- Run tests: `npm run test`
- Coverage report: `npm run test:coverage`

### E2E Tests
- Cypress against the packaged SPA on `http://localhost:8394` (`npm run service` must be running; do not run `npm run dev` at the same time — both bind **8394**)
- Entry and visits are prefixed: `/mentee/`, `/mentee/journey`, `/mentee/path/{id}`, `/mentee/resource/{id}`, `/mentee/config` (`baseUrl` stays `http://localhost:8394`; do not point Cypress at `:8080`)
- Prefer `cy.visitPrefixed(...)` from `cypress/support/commands.ts` over raw `cy.visit` for in-app routes — it asserts `PerformanceNavigationTiming` so a Vue Router rewrite cannot mask an un-prefixed document fetch
- `cy.login()` with no roles is an **admin** token — use `cy.login(['mentee'])` for mentee pages and `cy.login(['admin'])` for Settings
- Specs cover journey/path/resource detail, spa_utils `PageFrame` chrome (title, hamburger, this SPA’s `/mentee/config` Settings host and admin gate), Token-tab / chrome `display_name` from spa_utils **1.0.3** (`admin-token-display-name-display`, `nav-profile-name-display`), logout `return_to=/discovery/`, and the nginx deployment boundary (`deployment.cy.ts`: redirects, history fallback, cache headers, runtime-config, authenticated and unauthenticated `/mentee/api` proxy). Hamburger catalog role gates are tested in spa_utils, not here. Journey profile `full_name` and path/resource `name` are document fields, not the token display claim.
- Run tests: `npm run cypress` (interactive) or `npm run cypress:run` (headless)

## Adding New Features

When adding a new resource or feature:

1. **Add API Types**: Extend `src/api/types.ts` with new interfaces
2. **Add API Methods**: Add methods to `src/api/client.ts`
3. **Create Pages**: Follow the detail / edit pattern (collection lists live on Discovery)
4. **Add Routes**: Register routes in `src/router/index.ts`
5. **Use spa_utils Components**: For edit pages with PATCH support, use `DataCard` with type-aligned editors (`WordEditor`, `SentenceEditor`, `EnumEditor`, etc.); do not introduce new `AutoSaveField` usage.
6. **Query Management**: Use Vue Query for data fetching with appropriate query keys
7. **Cache Invalidation**: Invalidate related queries in mutation `onSuccess` callbacks
8. **Error Handling**: Use `useErrorHandler` from `spa_utils` for consistent error handling
9. **Write Tests**: Add unit tests and E2E tests for new functionality (note: common components are tested in `spa_utils`)

## Automation Support

All interactive elements in this SPA include `data-automation-id` attributes following the `{domain}-{page}-{element}` naming convention.

Cypress targets spa_utils `PageFrame` ids for chrome, not local ones. Hamburger catalog
role gates and collection hrefs are tested in spa_utils — this SPA only asserts host chrome
and routes:

- Always present when authenticated: `nav-drawer-toggle`, `page-frame-title`, `nav-profile-link`
- spa_utils **1.0.3** ids this host asserts (not local `nav-*` ids):
  - Token tab `admin-token-display-name-display` — config intercept `token.display_name`; missing claim renders `N/A` (no `name` / `given_name` / `email` fallback)
  - PageFrame chrome `nav-profile-name-display` inside `nav-profile-link` — JWT `display_name` next to the avatar; omitted when the claim is blank or missing
- This SPA hosts Settings at `/mentee/config` (`nav-settings-link`, admin-only)
- Token tab (AdminPage, spa_utils 1.0.3): `admin-tab-token`, `admin-token-display-name-display`, `admin-token-profile-id-display`, `admin-token-customer-id-display`, `admin-token-mentor-id-display`. Missing string claims display `N/A`. This SPA does not invent a local display-name mapping.

Do not define `app-bar-title` or host `nav-*` ids in this SPA.

## CI

`.github/workflows/docker-push.yml` builds and pushes the container image. Registry credentials and dependency policy for your org live in SRE / standards docs, not in this README.

## Configuration
- **Supported browser entry**: `http://<host>:8080/mentee/` via Developer Edition welcome / ALB
- **Direct-port debugging only**: `http://localhost:8394/mentee/` (Cypress, OpenAPI, `npm run service`); `http://localhost:8394/` redirects to `/mentee/`
- **API proxy**: the client calls `/mentee/api/` (derived from Vite `base`); container nginx proxies that to `http://${API_HOST}:${API_PORT}/api/` on `mentee_api` (port **8393**). Direct-port `/api/` is kept for debugging
- Runtime enumerators come from `GET /mentee/api/config` (or `/api/config` on the direct port), not from OpenAPI
- Docker container uses `API_HOST` and `API_PORT` environment variables for API proxy configuration
- Container listens on port 80 internally; map host port to container port 80 (e.g., `8394:80` in docker-compose)