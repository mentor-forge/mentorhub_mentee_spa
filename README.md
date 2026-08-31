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
| `http://localhost:8394/mentee/resources/{id}` | `/resources/:id` | `ResourceViewPage.vue` (Discovery resource card target) |
| `http://localhost:8394/mentee/paths/{id}` | `/paths/:id` | `PathViewPage.vue` (Discovery path card target) |
| `http://localhost:8394/mentee/admin` | `/admin` | `AdminPage.vue` (runtime-config viewer, `admin` role required) |

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

**Note**: This template uses `@mentor-forge/mentorhub_spa_utils@1.0.0` for reusable components, composables, and utilities. See the [mentorhub_spa_utils README](../mentorhub_spa_utils/README.md) for complete documentation on available components (`PageFrame`, `CardGrid`, `MhCard`, `DataCard`, typed editors, `ListPageSearch`), composables (`useResourceList`, `useErrorHandler`, `useRoles`), and utilities (`formatDate`, `validationRules`).

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
This template uses components and composables from `@mentor-forge/mentorhub_spa_utils@1.0.0`:
- **Shell**: `PageFrame` is the navigation shell (app bar, role-gated hamburger drawer, profile link, and IdP logout). Local nav config is disallowed — do not pass `navItems`, URL maps, ALB origin, or extra drawer slots. The only host prop is `pageTitle`, bound reactively from `useAppTitle` as `:page-title="appBarTitle"` so the bar shows `{full_name}:Mentee` once the journey loads (and `Mentee` before that).
- **Components**: `CardGrid`, `MhCard`, `DataCard`, typed editors (`WordEditor`, `SentenceEditor`, `EnumEditor`, `EnumArrayEditor`, `BreadcrumbDisplay`), and `ListPageSearch`. Prefer `DataCard` + typed editors for view/edit forms. `AutoSaveField` is a compatibility wrapper for legacy pages; `AutoSaveSelect` remains available where runtime enumerators have not yet migrated.
- **Composables**: `useResourceList`, `useErrorHandler`, `useRoles`, `provideEditorConfig`
- **Utilities**: `formatDate`, `validationRules`

See the [mentorhub_spa_utils README](../mentorhub_spa_utils/README.md) for complete documentation and usage examples.

### Component Architecture
- **App Shell**: `PageFrame` wraps `router-view` inside the host `v-app`. Title markup lives in spa_utils (`page-frame-title`); title *logic* stays in `useAppTitle`.
- **Pages**: Own routing, data fetching, and mutations. Pass data + callbacks to components.
- **Components**: App-specific components (admin components). Reusable components come from `spa_utils`.
- **Composables**: App-specific logic (authentication, config, app-bar title). Reusable composables come from `spa_utils`.
- **Stores**: UI-only state (loading, error messages, etc.)

## Testing

### Unit Tests
- Uses Vitest for unit testing
- Test coverage target: 90%
- Tests cover: API client, composables, and components
- Run tests: `npm run test`
- Coverage report: `npm run test:coverage`

### E2E Tests
- Uses Cypress for end-to-end testing
- Tests cover main user flows: login, CRUD operations for each domain
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

Cypress targets spa_utils `PageFrame` ids for chrome, not local ones:

- Always present: `nav-drawer-toggle`, `page-frame-title`, `nav-profile-link`, `nav-home-link`, `nav-notifications-link`, `nav-logout-link`
- Role-gated (token must carry the role): `nav-products-link`, `nav-settings-link`, `nav-resources-link`, `nav-paths-link`, `nav-plans-link`, `nav-customer-link`, `nav-customer-members-link`

Do not define `app-bar-title` or host `nav-*` ids in this SPA. Full drawer coverage is F132.

## CI

`.github/workflows/docker-push.yml` builds and pushes the container image. Registry credentials and dependency policy for your org live in SRE / standards docs, not in this README.

## Configuration
- **Supported browser entry**: `http://<host>:8080/mentee/` via Developer Edition welcome / ALB
- **Direct-port debugging only**: `http://localhost:8394/mentee/` (Cypress, OpenAPI, `npm run service`); `http://localhost:8394/` redirects to `/mentee/`
- **API proxy**: the client calls `/mentee/api/` (derived from Vite `base`); container nginx proxies that to `http://${API_HOST}:${API_PORT}/api/` on `mentee_api` (port **8393**). Direct-port `/api/` is kept for debugging
- Runtime enumerators come from `GET /mentee/api/config` (or `/api/config` on the direct port), not from OpenAPI
- Docker container uses `API_HOST` and `API_PORT` environment variables for API proxy configuration
- Container listens on port 80 internally; map host port to container port 80 (e.g., `8394:80` in docker-compose)