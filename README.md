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

## Developer Commands

```sh
## install dependencies (run `mh` first for CodeArtifact auth)
npm ci

## install Cypress binaries
npx cypress install

## package code for deployment
npm run build 

## run dev server at http://localhost:8394/mentee/, assumes api is running - captures command line
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

**Port 8394 is exclusive.** `npm run dev` and `npm run service` (the `mentee_spa` container) both bind host port **8394**, so they cannot run at the same time. Use `npm run api` to drop the whole stack and bring up only mongodb + the Mentee API before starting `npm run dev`.

## Architecture Overview

```
src/
  api/              # API client layer (types.ts, client.ts)
  components/       # App-specific UI components (admin components)
  pages/            # Route-level components (detail pages only)
  composables/      # App-specific composables (useConfig, useRoles wrapper); auth from spa_utils
  stores/           # Pinia stores (UI state only)
  router/           # Vue Router configuration
  plugins/          # Vuetify plugin configuration
```

**This SPA hosts no list dashboards.** Collection browsing lives on **Discovery**, which is the only journey SPA with CardGrid list pages. This repo keeps the detail pages that Discovery cards deep-link into:

| Browser URL | Route | Page |
|-------------|-------|------|
| `/mentee/` | `/` | redirect to `/journey` |
| `/mentee/journey` | `/journey` | `JourneyEditPage.vue` — the caller-scoped journey detail page |
| `/mentee/paths/{id}` | `/paths/:id` | `PathViewPage.vue` — Discovery path card target |
| `/mentee/resources/{id}` | `/resources/:id` | `ResourceViewPage.vue` — Discovery resource card target |
| `/mentee/admin` | `/admin` | `AdminPage.vue` — runtime-config viewer, requires the `admin` role |

**`http://<host>:8080/mentee/` — the welcome / ALB origin — is the supported browser entry point.** Direct port **8394** (`http://localhost:8394/mentee/`) is for Cypress, OpenAPI, and debugging only; never link to it from another SPA. On the dev server the same URLs are served by Vite at `http://localhost:8394/mentee/…`. See "Base Path" below.

Detail pages link back out to the Discovery collections with `buildJourneyUrl('discovery', …)` from `spa_utils` — absolute welcome / ALB hrefs, never Vue Router targets.

**Note**: This SPA uses `@mentor-forge/mentorhub_spa_utils` for reusable components, composables, and utilities. The dependency is pinned to the exact version **`1.0.0`** in `package.json` — no caret range. Run `mh` for CodeArtifact credentials before installing. See the [mentorhub_spa_utils README](../mentorhub_spa_utils/README.md) for complete documentation.

## Key Implementation Patterns

### Base Path
- The app is mounted under the journey prefix: `vite.config.ts` sets `base: '/mentee/'` and the router uses `createWebHistory(import.meta.env.BASE_URL)`.
- Route `path` strings stay unprefixed (`/`, `/journey`, `/paths/:id`, …). The prefix comes only from the base — duplicating it in a route path would produce `/mentee/mentee/…`.
- The `injectRuntimeConfig` plugin in `vite.config.ts` injects `<script src="${base}runtime-config.js">` ahead of the app bundle, so the container runtime config is fetched from `/mentee/runtime-config.js`. The tag carries Vite's `vite-ignore` attribute because Vite would otherwise join the base onto the already-prefixed URL.
- The unauthenticated router guard builds the IdP `return_to` from the origin plus `BASE_URL`, so a logged-out deep link to `/mentee/paths/{id}` comes back to that same prefixed URL.
- `npm run dev` proxies both `/api` (direct-port debugging) and `/mentee/api` (the shape welcome nginx and the ALB serve) to the Mentee API on `http://localhost:8393`.
- Vite `base` prefixes asset **URLs** only — the build output stays flat in `dist/`, with no `dist/mentee/` folder. Container nginx therefore maps the prefix onto the same docroot with an internal `rewrite` (see `nginx.conf.template`).

### Container URLs and Proxy Boundaries

`nginx.conf.template` (port 80 in the container, published as 8394) serves:

| Request | Handling |
|---------|----------|
| `/mentee/api/…` | proxied to `http://${API_HOST}:${API_PORT}/api/…` — the prefix is stripped so the Mentee API still sees `/api/…` |
| `/api/…` | the same proxy, kept for direct-port debugging |
| `/mentee/` and `/mentee/{route}` | the app shell via history fallback, `Cache-Control: no-store` |
| `/mentee/assets/…` and other prefixed static files | served from the flat docroot as `public, immutable` |
| `/mentee/runtime-config.js` and `/runtime-config.js` | the `envsubst`-generated IdP config, `Cache-Control: no-store` |
| `/` and `/mentee` | 302 to `/mentee/` |
| `/health` | `healthy` for the container health check |

This container proxies **only** the Mentee API — no other journey SPA and no other domain's `/api` is reachable through it. Browser API calls go to `/mentee/api/…` because `src/api/client.ts` derives its base from `import.meta.env.BASE_URL`.

Two nginx ordering rules make this work, and both are load-bearing: regex locations beat plain prefix locations, so the prefixed asset regex must stay **ahead of** the root-path one; and `location ^~ /mentee/api/` suppresses regex evaluation entirely so an API path ending in `.js` can never be captured by the asset cache.

### Navigation Shell
- `src/App.vue` is a single host `<v-app>` wrapping **`PageFrame`** from `@mentor-forge/mentorhub_spa_utils@1.0.0`, which owns the app bar, the role-gated hamburger drawer, the profile avatar, `<v-main>`, and logout:

```vue
<v-app>
  <PageFrame :page-title="appBarTitle">
    <router-view />
  </PageFrame>
</v-app>
```

- **Local nav config is disallowed.** `pageTitle` is the only prop this SPA passes — never `navItems`, URL maps, an ALB origin, role tables, or extra drawer slots. The hamburger catalog, its role gates, and the cross-SPA hrefs are compiled into spa_utils; links are added or changed there, not here.
- The app bar title stays app-owned: `useAppTitle` produces `{full_name}:Mentee` (and `Mentee` before the journey resolves) plus the `document.title` side effect, and `App.vue` binds it reactively as `:page-title="appBarTitle"`.
- `PageFrame` does **not** render a `v-container`, and `App.vue` does not add one — every page opens with its own `<v-container>`.
- Drawer rows are absolute welcome / ALB hrefs from `buildJourneyUrl` (they usually leave for another SPA), not Vue Router `to` targets. `/admin` is not in the catalog, so the runtime-config viewer is reachable by direct URL only and stays `admin`-gated by the router.

### Authentication
- JWT tokens stored in localStorage (`access_token`, `token_expires_at`)
- Auth (`useAuth`, `redirectToIdpLogin`, `bootstrapAuthFromUrl`) from `@mentor-forge/mentorhub_spa_utils`; see `src/initAuth.ts`
- Sign-in uses IdP / URL hash (`bootstrapAuthFromUrl` from spa_utils); APIs are not used as a login surface
- Router guards protect routes requiring authentication

### API Client
- Located in `src/api/client.ts`
- The API base is derived from the Vite base (`` `${import.meta.env.BASE_URL}/api` `` collapsed to single slashes), so the browser calls `/mentee/api/…` and reaches `mentee_api` through this SPA's own nginx
- All API calls include JWT token from localStorage
- Error handling via `ApiError` class
- Type-safe with TypeScript interfaces in `src/api/types.ts`

### Data Fetching
- Uses TanStack Query (Vue Query) for server state management
- Query keys follow pattern: `['resource', id]` or `['resources']`
- Mutations invalidate related queries on success
- Example: `useQuery({ queryKey: ['control', id], queryFn: () => api.getControl(id) })`

### Reusable Components and Composables
This SPA uses components and composables from `@mentor-forge/mentorhub_spa_utils@1.0.0`:
- **Navigation shell**: `PageFrame`
- **Cards**: `MhCard`, `DataCard`
- **Editors**: `SentenceEditor`, `MarkdownEditor`, `UrlEditor`, `CountEditor`, `DateTimeEditor`, `DurationEditor`, `EnumEditor`, `EnumArrayEditor`
- **Cross-SPA URLs**: `buildJourneyUrl`, `JOURNEY_APP_PATHS`
- **Composables**: `useErrorHandler`, `useRoles`, `useAuth`, `provideEditorConfig`

`AutoSaveField` and `AutoSaveSelect` remain exported but are legacy — prefer the type-aligned editors above with `DataCard`.

The list-dashboard building blocks (`CardGrid`, `ListPageSearch`) and the infinite-scroll list APIs (`useInfiniteScroll`, `InfiniteScroll*` types, removed in spa_utils 1.0.0) are not used here: this SPA has no list pages, and the cursor fields `after_id`, `has_more`, and `next_cursor` do not appear in its API contracts.

See the [mentorhub_spa_utils README](../mentorhub_spa_utils/README.md) for complete documentation and usage examples.

### Component Architecture
- **App shell**: `App.vue` holds the single `v-app`, the `PageFrame` shell, the startup `/api/config` fetch, and `provideEditorConfig`. It defines no chrome of its own.
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
- Uses Cypress for end-to-end testing
- Tests cover main user flows: login, CRUD operations for each domain
- Run tests: `npm run cypress` (interactive) or `npm run cypress:run` (headless)

## Adding New Features

When adding a new resource or feature:

1. **Add API Types**: Extend `src/api/types.ts` with new interfaces
2. **Add API Methods**: Add methods to `src/api/client.ts`
3. **Create Pages**: Detail, edit, and create pages only — collection browsing belongs on Discovery, so do not add a list dashboard here
4. **Add Routes**: Register routes in `src/router/index.ts`
5. **Use spa_utils Components**: For edit pages with PATCH support, compose `DataCard` with the type-aligned editors (`SentenceEditor`, `EnumEditor`, …) from `spa_utils`. To send a user to a collection, link out with `buildJourneyUrl('discovery', …)`.
6. **Query Management**: Use Vue Query for data fetching with appropriate query keys
7. **Cache Invalidation**: Invalidate related queries in mutation `onSuccess` callbacks
8. **Error Handling**: Use `useErrorHandler` from `spa_utils` for consistent error handling
9. **Write Tests**: Add unit tests and E2E tests for new functionality (note: common components are tested in `spa_utils`)

## Automation Support

All interactive elements in this SPA include `data-automation-id` attributes following the `{domain}-{page}-{element}` naming convention.

The navigation chrome ids come from the spa_utils `PageFrame`, not from this repo — Cypress targets them directly:

| Element | `data-automation-id` |
|---------|----------------------|
| Hamburger toggle | `nav-drawer-toggle` |
| App bar title | `page-frame-title` |
| Profile avatar link | `nav-profile-link` |
| Drawer rows, any token | `nav-home-link`, `nav-notifications-link` |
| Drawer rows, role-gated | `nav-products-link`, `nav-settings-link` (`admin`); `nav-resources-link`, `nav-paths-link`, `nav-plans-link` (`mentor`); `nav-customer-link`, `nav-customer-members-link` (`customer`) |
| Logout | `nav-logout-link` |

No `data-automation-id` beginning with `nav-`, and no `app-bar-title`, is defined in `src/`.

## CI

`.github/workflows/docker-push.yml` builds and pushes the container image. Registry credentials and dependency policy for your org live in SRE / standards docs, not in this README.

## Configuration
- Runtime configuration available at the `/mentee/api/config` endpoint (`/api/config` on the direct debug port)
- Use enumerator values from config, not hardcoded in OpenAPI spec
- Docker container uses `API_HOST` and `API_PORT` environment variables for API proxy configuration
- Container listens on port 80 internally; map host port to container port 80 (e.g., `8185:80` in docker-compose)