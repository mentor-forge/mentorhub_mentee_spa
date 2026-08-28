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

> [!WARNING]
> `npm run dev` and `npm run service` both bind host port **8394** and cannot run at the same time.

```sh
## install dependencies (run `mh` first for CodeArtifact auth)
npm ci

## install Cypress binaries
npx cypress install

## package code for deployment
npm run build 

## run dev server at http://localhost:8394/mentee/ (assumes api is running)
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
  components/       # App-specific UI components (admin components, ResourceViewCard)
  pages/            # Detail-only pages (JourneyEditPage, PathViewPage, ResourceViewPage, AdminPage)
  composables/      # App-specific composables (useConfig, useRoles wrapper); auth from spa_utils
  stores/           # Pinia stores (UI state only)
  router/           # Vue Router configuration (locked detail routes)
  plugins/          # Vuetify plugin configuration
```

Collection browsing lives on Discovery (`/discovery/paths`, `/discovery/resources`, etc.); this SPA contains no list dashboards and keeps the caller-scoped journey detail page plus the path and resource detail pages that Discovery cards target.

### Route Table & URLs

| Browser URL (under `/mentee/` base) | Vue Router path | Page |
|---|---|---|
| `http://<host>:8080/mentee/` | `/` | redirect → `/journey` |
| `http://<host>:8080/mentee/journey` | `/journey` | `JourneyEditPage.vue` (caller-scoped journey detail) |
| `http://<host>:8080/mentee/resources/{id}` | `/resources/:id` | `ResourceViewPage.vue` (Discovery resource card target) |
| `http://<host>:8080/mentee/paths/{id}` | `/paths/:id` | `PathViewPage.vue` (Discovery path card target) |
| `http://<host>:8080/mentee/admin` | `/admin` | `AdminPage.vue` (runtime-config viewer, `requiresRole: 'admin'`) |

**Note**: This SPA pins `@mentor-forge/mentorhub_spa_utils@1.0.0` for reusable components, composables, and utilities. See the [mentorhub_spa_utils README](../mentorhub_spa_utils/README.md) for complete documentation on available components (`AutoSaveField`, `EnumEditor`, `EnumArrayEditor`, `ListPageSearch`), composables (`useErrorHandler`, `useRoles`), and utilities (`formatDate`, `validationRules`).

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
- Query keys follow pattern: `['journey']`, `['path', id]`, or `['resource', id]`
- Mutations invalidate related queries on success
- Example: `useQuery({ queryKey: ['path', pathId], queryFn: () => api.getPath(pathId.value) })`

### Reusable Components and Composables
This SPA uses components and composables from `@mentor-forge/mentorhub_spa_utils@1.0.0`:
- **Components**: `AutoSaveField`, `EnumEditor`, `EnumArrayEditor`, `ListPageSearch`
- **Composables**: `useErrorHandler`, `useRoles`
- **Utilities**: `formatDate`, `validationRules`

See the [mentorhub_spa_utils README](../mentorhub_spa_utils/README.md) for complete documentation and usage examples.

### Component Architecture
- **Navigation Shell**: `PageFrame` from `@mentor-forge/mentorhub_spa_utils@1.0.0` provides the single app bar, role-gated hamburger drawer, profile link, and logout. Local nav configuration is disallowed. The dynamic title `{full_name}:Mentee` is bound reactively via `:page-title="appBarTitle"`.
- **Pages**: Own routing, data fetching, and mutations. Pass data + callbacks to components.
- **Components**: App-specific components (admin components, ResourceViewCard). Reusable components come from `spa_utils`.
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
3. **Create Pages**: Follow the detail/view page pattern (`src/pages/*ViewPage.vue`)
4. **Add Routes**: Register routes in `src/router/index.ts`
5. **Use spa_utils Components**: For edit forms with PATCH support, use `DataCard` and configurator-type editors (`WordEditor`, `SentenceEditor`, `EnumEditor`, `EnumArrayEditor`, `AutoSaveField`) from `spa_utils`.
6. **Query Management**: Use Vue Query for data fetching with appropriate query keys
7. **Cache Invalidation**: Invalidate related queries in mutation `onSuccess` callbacks
8. **Error Handling**: Use `useErrorHandler` from `spa_utils` for consistent error handling
9. **Write Tests**: Add unit tests and E2E tests for new functionality (note: common components are tested in `spa_utils`)

## Automation Support

Interactive elements in this SPA include `data-automation-id` attributes following the `{domain}-{page}-{element}` naming convention. Navigation and shell elements use standard `spa_utils` `PageFrame` automation ids: `nav-drawer-toggle`, `page-frame-title`, `nav-profile-link`, `nav-home-link`, `nav-notifications-link`, `nav-logout-link` (and role-gated items `nav-products-link`, `nav-settings-link`).

## CI

`.github/workflows/docker-push.yml` builds and pushes the container image. Registry credentials and dependency policy for your org live in SRE / standards docs, not in this README.

## Configuration
- Welcome origin `http://<host>:8080/mentee/` is the supported browser entry point.
- Direct port `http://localhost:8394/mentee/` is for direct-port debugging and Cypress testing only.
- API calls reach `mentee_api` via this SPA's nginx proxy at `/mentee/api/` (`/api/` is retained for direct-port debugging).
- Runtime configuration is available at the `/mentee/api/config` endpoint (with `/api/config` fallback).
- Use enumerator values from config, not hardcoded in OpenAPI spec.
- Docker container uses `API_HOST` and `API_PORT` environment variables for API proxy configuration.
- Container listens on port 80 internally; mapped to host port 8394 in docker-compose.