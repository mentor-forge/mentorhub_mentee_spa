# F128 – Retire the CardGrid list pages, lock the detail-only route table

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F127_pin_spa_utils_1_0_0`  
**Description**: Delete this SPA's two CardGrid list dashboards (`PathsListPage.vue`, `ResourcesListPage.vue`), their routes, their offset-list plumbing, their API surface, their Cypress coverage, and their local drawer rows. Collection browsing moves to Discovery; this SPA keeps **detail** pages that Discovery cards deep-link into. Repoint the two "Back to List" actions and the router role gate out to Discovery with `buildJourneyUrl` (available now that F127 pinned 1.0.0). Route `path` strings stay unprefixed — Vite `base` is F130.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — `data-automation-id` convention `{domain}-{page}-{element}`
- `../mentorhub_spa_utils/README.md` — **List cards** ("Discovery is the only journey SPA that hosts CardGrid list dashboards; other journey SPAs keep detail, edit, and create pages that Discovery cards and universal nav target"); **Cross-SPA URLs** (`buildJourneyUrl`, `JOURNEY_APP_PATHS`, `resolveAlbOrigin`); **Removed: infinite-scroll list APIs**
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `tasks/PENDING.F127.pin_spa_utils_1_0_0.md` — wave-ordering rationale
- `src/router/index.ts` — today `/` redirects to `/journey`; routes `/journey`, `/resources`, `/resources/:id`, `/paths`, `/paths/:id`, `/admin`; role-gate fallback is `next({ name: 'Journey' })`
- `src/App.vue` — local app bar and drawer with `nav-journey-link`, `nav-paths-link`, `nav-resources-link`, `nav-admin-link`, `nav-logout-link`
- `src/pages/PathsListPage.vue`, `src/pages/ResourcesListPage.vue` — the two CardGrid dashboards being deleted
- `src/composables/useOffsetList.ts` — local TanStack `useInfiniteQuery` wrapper; the two list pages are its only consumers
- `src/api/client.ts` — `getPaths(params?: ListParams)` and `getResources(params?: ListParams)` send `offset` / `size` request headers and return plain arrays; both are list-only
- `src/api/types.ts` — `ListParams` (`offset`, `size`, `name`, `description`, `status`, `url`, `interests`, `technologies`, `skill_level`, `sort_by`, `order`)
- `src/api/Path.client.test.ts`, `src/api/Resource.client.test.ts`, `src/api/types.test.ts` — cover the list methods and `ListParams`
- `src/pages/PathViewPage.vue` — kept; has a `path-view-back-to-list-button` calling `router.push('/paths')`
- `src/pages/ResourceViewPage.vue` — kept; has a `resource-view-back-to-list-button` calling `router.push('/resources')`
- `src/pages/JourneyEditPage.vue` — kept; the caller-scoped journey detail page and the home target
- `src/pages/AdminPage.vue` — kept; the shared runtime-config viewer at `/admin`
- `cypress/e2e/path.cy.ts`, `cypress/e2e/resource.cy.ts`, `cypress/e2e/journey.cy.ts`, `cypress/e2e/navigation.cy.ts`
- `vitest.config.ts` — coverage thresholds for `src/api/**`, `src/composables/**`, `src/components/**`

**Source issue**: F-ES10. Users find mentee journeys and collections on Discovery (`/discovery/`, `/discovery/resources`, `/discovery/paths`, …); this SPA is detail-oriented for Discovery card targets.

**External prerequisite**: none beyond F127. This task changes no dependency versions.

### Locked route decisions

Vue route `path` strings stay **unprefixed** in this task. The browser URLs in the left column are what F130/F131 produce once `base: '/mentee/'` ships. Vite `base` prefixes every browser URL without touching route `path` strings, so nothing decided here is re-prefixed later.

| Browser URL (after F130–F131) | Vue path | Page |
|---|---|---|
| `http://<host>:8080/mentee/` | `/` | redirect → `/journey` |
| `http://<host>:8080/mentee/journey` | `/journey` | `JourneyEditPage.vue` (caller-scoped journey detail) |
| `http://<host>:8080/mentee/resources/{id}` | `/resources/:id` | `ResourceViewPage.vue` (Discovery resource card target) |
| `http://<host>:8080/mentee/paths/{id}` | `/paths/:id` | `PathViewPage.vue` (Discovery path card target) |
| `http://<host>:8080/mentee/admin` | `/admin` | `AdminPage.vue` (runtime-config viewer, `requiresRole: 'admin'`) |

**Removed routes**: `/resources` and `/paths` — the two list dashboards.

Two decisions are locked here so a later task does not churn them:

- **`/` stays a redirect to `/journey`.** Issue F-ES09 explicitly says to keep the route paths `/journey`, `/resources`, and `/paths` rather than duplicating a prefix into them; keeping the redirect satisfies that, preserves the existing "land on journey page from default route" coverage, and lets Discovery link either `/mentee/` or `/mentee/journey`. Do **not** collapse the redirect into a component route on `/`.
- **`/admin` keeps its path.** The sibling Customer SPA moved its config viewer to `/config` because a root-mounted `/admin` reads like the Admin journey prefix. Under the `/mentee/` base that ambiguity does not exist (`/mentee/admin`), and renaming would add Cypress churn this wave does not need. Do **not** rename it to `/config`.

### Rating and note pages: nothing to keep

Issue F-ES10 says to keep journey, rating, and note **detail** pages. This repo has **no** rating or note pages and no rating or note routes — mentees capture a rating and a note inline when completing a resource, via `src/components/JourneyCompleteDialog.vue` reached from `JourneyEditPage.vue`. So there is nothing to keep and nothing to create: preserve the existing complete-with-rating-and-note flow exactly as it is, and record in **Execution Notes** that the issue's rating/note detail pages do not exist in this SPA. Do **not** invent new rating or note routes to satisfy the issue text.

### Leaving for Discovery

Both kept detail pages currently offer "Back to List" into a page this task deletes. Replace each with a link out to the corresponding Discovery collection, built with the same helper the `PageFrame` hamburger uses:

```typescript
import { buildJourneyUrl } from '@mentor-forge/mentorhub_spa_utils'

const browsePathsHref = buildJourneyUrl('discovery', 'paths')
const browseResourcesHref = buildJourneyUrl('discovery', 'resources')
```

These are absolute welcome / ALB hrefs on `:8080`, not Vue Router `to` targets — they leave this SPA. Use an anchor (`:href`) or `window.location.assign(...)`, never `router.push`. Do not hardcode an origin, a direct SPA debug port, or the IdP host.

## Goals

- `src/pages/PathsListPage.vue` and `src/pages/ResourcesListPage.vue` are deleted, and no source, test, or Cypress file references them or their `path-list-*` / `resource-list-*` automation ids.
- `src/composables/useOffsetList.ts` is deleted — the two list pages were its only consumers. A grep for `useOffsetList` across `src/` and `cypress/` returns nothing.
- `src/api/client.ts` no longer has `getPaths` or `getResources`. Everything else is unchanged: `getConfig`, `getMyJourney`, `updateJourney`, `advanceJourneyResource`, `completeJourneyResource`, `promoteJourneyPath`, `promoteJourneyModule`, `getResource`, `getAggregationDetail`, and `getPath` keep their current signatures and behavior, including the `Authorization` header, the `401` logout-and-redirect path, and the `204` / empty-body handling.
- `src/api/types.ts` no longer declares `ListParams`; `src/api/types.test.ts` drops its `ListParams` describe block. No remaining `src/api/**` contract carries `offset` or `size` request headers.
- `src/api/Path.client.test.ts` and `src/api/Resource.client.test.ts` drop only the `it` blocks covering `getPaths` / `getResources`; every kept method keeps its existing coverage so the `src/api/**` thresholds in `vitest.config.ts` still pass.
- `src/router/index.ts` matches the locked route table above: `/` → `/journey`, `/journey`, `/resources/:id`, `/paths/:id`, `/admin`, and neither `/resources` nor `/paths` resolves any more. `createWebHistory()` stays as-is — F130 adds the base.
- The unauthenticated guard still calls `redirectToIdpLogin(window.location.origin + to.fullPath)` and `next(false)` (base-aware return URLs are F130). The `requiresRole` fallback no longer targets a local route: build the Discovery journey home with `buildJourneyUrl` (or `JOURNEY_APP_PATHS.home`), navigate with `window.location.replace(...)`, and call `next(false)`. Never render a gated page to a user without the role.
- `src/pages/PathViewPage.vue` replaces `path-view-back-to-list-button` with an absolute Discovery link (suggested id `path-view-browse-paths-link`, label "Browse Paths"); `src/pages/ResourceViewPage.vue` replaces `resource-view-back-to-list-button` the same way (suggested id `resource-view-browse-resources-link`, label "Browse Resources"). Neither page keeps an unused `useRouter` import.
- No `router.push` or `to` anywhere in `src/` targets `/paths` or `/resources` as a list route. Links to `/paths/:id` and `/resources/:id` detail routes are unaffected.
- `src/App.vue` keeps its current chrome shape but the drawer no longer has rows for deleted routes: `nav-paths-link` and `nav-resources-link` are gone; `nav-journey-link`, the admin row, and the logout row stay. Logout behavior, the `useAppTitle` title, the `getMyJourney` query, and `provideEditorConfig` are unchanged. Do **not** add replacement local nav — F129 deletes this chrome for `PageFrame`.
- Cypress is reduced to direct-visit coverage of kept routes:
  - `cypress/e2e/path.cy.ts` and `cypress/e2e/resource.cy.ts` drop every `it` that visits `/paths` or `/resources`, waits on a `getPaths` / `getResources` intercept, or clicks through from a list card; the detail-page `it` blocks that visit `/paths/path-1` and `/resources/resource-1` survive unchanged.
  - `cypress/e2e/journey.cy.ts` drops `should navigate to journey from drawer` (it visits `/paths`); every other `it` survives.
  - `cypress/e2e/navigation.cy.ts` is deleted — it asserts the local drawer that F129 removes, and F132 rewrites navigation coverage against the spa_utils `PageFrame` ids.
  - Do not re-point any visit to a `/mentee/` prefix here. **F132** owns the whole prefixed Cypress rewrite.
- `README.md` Architecture Overview reflects the new page set: no list dashboards in this SPA, collection browsing lives on Discovery, and this repo keeps the journey detail page plus the path and resource detail pages that Discovery cards target. Drop the `useResourceList`-for-list-pages guidance from "Data Fetching" and "Adding New Features".
- Dependency versions are untouched: `package.json` keeps the exact `1.0.0` pin from F127.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test` — the reduced `src/api/*.client.test.ts` and `src/api/types.test.ts` suites must pass, and the `src/api/**` and `src/composables/**` coverage thresholds must still hold after `useOffsetList.ts` is deleted (it had no test file, so deleting it should help rather than hurt; confirm with `npm run test:coverage` if a threshold trips)
- `npm run build` — `vue-tsc` must be clean; this repo defines no `lint` script, so `npm run build` is the type gate
- `npm run api` then `npm run dev` — manual check at `http://localhost:8394/`:
  - `/` redirects to `/journey` and the journey detail card renders
  - `/paths` and `/resources` no longer resolve to a page
  - `/paths/{id}` and `/resources/{id}` still render their detail pages, and the new browse actions point at `http://<host>:8080/discovery/paths` and `http://<host>:8080/discovery/resources`
  - the drawer has no Paths or Resources rows
  - completing a resource from the journey page still captures a rating and a note
  - an authenticated login without the `admin` role visiting `/admin` is redirected out to the Discovery journey home

**Packaging verification:**

- `npm run container` — build the SPA container image
- `npm run service` — run db + API + SPA containers
- `npm run cypress:run` — headless end-to-end tests (long running). All surviving specs must pass at the un-prefixed origin; prefixed visits arrive in F132.

Do not run `npm run dev` and `npm run service` at the same time — both bind host port **8394**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/router/index.ts` — locked route table; role-gate fallback leaves for Discovery via `buildJourneyUrl`
- `src/App.vue` — drawer rows for deleted routes removed
- `src/api/client.ts` — `getPaths` / `getResources` removed
- `src/api/types.ts` — `ListParams` removed
- `src/api/Path.client.test.ts`, `src/api/Resource.client.test.ts`, `src/api/types.test.ts` — list `it` blocks and the `ListParams` block removed
- `src/pages/PathViewPage.vue` — Discovery browse link replaces "Back to List"
- `src/pages/ResourceViewPage.vue` — Discovery browse link replaces "Back to List"
- `cypress/e2e/path.cy.ts`, `cypress/e2e/resource.cy.ts` — list-dependent `it` blocks removed
- `cypress/e2e/journey.cy.ts` — drawer-navigation `it` removed
- `README.md` — page set, "collections live on Discovery", list-page guidance dropped

**Delete:**

- `src/pages/PathsListPage.vue`
- `src/pages/ResourcesListPage.vue`
- `src/composables/useOffsetList.ts`
- `cypress/e2e/navigation.cy.ts` — local-drawer spec; F132 adds the `PageFrame` replacement

Do not change `package.json`, `package-lock.json`, `vite.config.ts`, `nginx.conf.template`, `Dockerfile`, `cypress.config.ts`, `vitest.config.ts`, `src/components/**`, or `src/pages/JourneyEditPage.vue` in this task.

## Execution Notes

### Plan

1. Read the task, `_ORCHESTRATE.md`, `_PLANNING.md`, `SHIPPED.F127...`, the two standards docs, and the spa_utils README (Cross-SPA URLs / List cards) before touching code. Confirm `buildJourneyUrl` / `JOURNEY_APP_PATHS` in the installed 1.0.0 `dist/utils/journeyUrls.d.ts`.
2. Router: delete the `/resources` and `/paths` list routes; leave `/` → `/journey`, `/journey`, `/resources/:id`, `/paths/:id`, `/admin` and `createWebHistory()` untouched. Replace the `next({ name: 'Journey' })` role-gate fallback with `window.location.replace(buildJourneyUrl(...JOURNEY_APP_PATHS.home))` + `next(false)`.
3. `src/App.vue`: drop only the `nav-paths-link` and `nav-resources-link` drawer rows. No replacement nav (F129 owns the chrome).
4. API: remove `getPaths` / `getResources` from `src/api/client.ts` (and the now-unused `Path` / `Resource` / `ListParams` type imports — `tsconfig.app.json` sets `noUnusedLocals`), and remove `ListParams` from `src/api/types.ts`.
5. Tests: drop the list `it` blocks from `src/api/Path.client.test.ts` / `src/api/Resource.client.test.ts` and the `ListParams` describe + type import from `src/api/types.test.ts`.
6. Detail pages: replace both "Back to List" buttons with absolute Discovery anchors built from `buildJourneyUrl('discovery', 'paths'|'resources')`; drop the now-unused `useRouter` imports.
7. Cypress: drop list-visiting / list-intercept / click-through `it` blocks (and their now-dead list fixtures and the broad list intercepts) from `path.cy.ts` and `resource.cy.ts`; drop `should navigate to journey from drawer` from `journey.cy.ts`; delete `navigation.cy.ts`. No `/mentee/` prefixing (F132).
8. Delete `src/pages/PathsListPage.vue`, `src/pages/ResourcesListPage.vue`, `src/composables/useOffsetList.ts`.
9. README: Architecture Overview page set, collections-live-on-Discovery note, drop list-page guidance from "Data Fetching" and "Adding New Features".
10. Verify: `npm run test`, `npm run build`, the required greps, then packaging (`npm run container`, `npm run service`, `npm run cypress:run`).

### Commands run

```sh
rg -n "useOffsetList" src/ cypress/
rg -n "PathsListPage|ResourcesListPage" src/ cypress/
rg -n "path-list-|resource-list-" src/ cypress/
rg -n "back-to-list" src/ cypress/
rg -n "getPaths|getResources|ListParams" src/ cypress/
rg -n "'/paths'|\"/paths\"|'/resources'|\"/resources\"" src/ cypress/
rg -n "nav-paths-link|nav-resources-link" src/ cypress/
rg -n "offset|size:" src/api/
rg -n "/paths|/resources" src/ cypress/          # remaining hits are detail routes only
npm run test
npm run build
npm run test:coverage                            # informational, see below
npm run container
npm run service
curl -s -o /dev/null -w "%{http_code}" http://localhost:8394/        # 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:8394/api/config  # 401 unauthenticated
npm run cypress:run
npx cypress run --spec cypress/e2e/tmp-f128-verify.cy.ts   # temporary spec, deleted after the run
```

### Results

**`npm run test`** — **PASS**: 10 test files, **47 tests passed, 0 failed** (was 54 under F127; the 7 removed are 2 `getPaths` `it`s, 2 `getResources` `it`s, and the 3 `ListParams` `it`s).

**`npm run build`** — **PASS**: `vue-tsc` clean, `vite build` succeeded, 651 modules transformed (was 656). Only the pre-existing >500 kB chunk advisory. `tsconfig.app.json` sets `noUnusedLocals`, so the now-unused `Path` / `Resource` / `ListParams` type imports in `src/api/client.ts` and the `useRouter` imports in both detail pages had to be removed for the type gate to pass.

**Grep verification** — all required greps return **no matches** (`rg` exit 1):

| Grep (over `src/` and `cypress/`) | Result |
|---|---|
| `useOffsetList` | no matches |
| `PathsListPage` / `ResourcesListPage` | no matches |
| `path-list-` / `resource-list-` | no matches |
| `back-to-list` | no matches |
| `getPaths` / `getResources` / `ListParams` | no matches |
| `'/paths'` / `'/resources'` as list targets | no matches |
| `nav-paths-link` / `nav-resources-link` | no matches |
| `offset` / `size:` in `src/api/` | no matches |

`rg -n "/paths|/resources" src/ cypress/` returns only detail-route hits: `src/router/index.ts` (`/resources/:id`, `/paths/:id`) and the surviving Cypress visits to `/paths/path-1` and `/resources/resource-1`.

**Route table now in `src/router/index.ts`** (unprefixed, exactly as locked):

| Vue path | Name | Page | Meta |
|---|---|---|---|
| `/` | — | redirect → `/journey` | — |
| `/journey` | `Journey` | `JourneyEditPage.vue` | `requiresAuth` |
| `/resources/:id` | `ResourceView` | `ResourceViewPage.vue` | `requiresAuth` |
| `/paths/:id` | `PathView` | `PathViewPage.vue` | `requiresAuth` |
| `/admin` | `Admin` | `AdminPage.vue` | `requiresAuth`, `requiresRole: 'admin'` |

`createWebHistory()` is untouched (F130 adds the base), and the unauthenticated guard still calls `redirectToIdpLogin(window.location.origin + to.fullPath)` + `next(false)`. The role gate no longer targets a local route:

```typescript
const requiredRole = to.meta.requiresRole as string | undefined
if (requiredRole && !hasStoredRole(requiredRole)) {
  const { journey, path } = JOURNEY_APP_PATHS.home
  window.location.replace(buildJourneyUrl(journey, path))
  next(false)
  return
}
```

**Discovery browse links.** Both kept detail pages use a `v-btn` with `:href` (renders an anchor, leaves the SPA) instead of `router.push`:

- `src/pages/PathViewPage.vue`: `const browsePathsHref = buildJourneyUrl('discovery', 'paths')`, rendered as `path-view-browse-paths-link` labelled "Browse Paths".
- `src/pages/ResourceViewPage.vue`: `const browseResourcesHref = buildJourneyUrl('discovery', 'resources')`, rendered as `resource-view-browse-resources-link` labelled "Browse Resources".

Verified live in the container run: both resolve to `http://localhost:8080/discovery/paths` and `http://localhost:8080/discovery/resources` — the welcome / ALB origin on `:8080`, not the SPA debug port.

**Packaging.**

- `npm run container` — **PASS**: `ghcr.io/mentor-forge/mentorhub_mentee_spa:latest` rebuilt.
- `npm run service` — **PASS**: mongodb, mongodb_api, mongodb_spa, mentee_api, mentee_spa, welcome all up. SPA `200` at `http://localhost:8394/`, nginx `/api/` proxy `401` unauthenticated (expected), welcome `200` at `http://127.0.0.1:8080/`.
- `npm run cypress:run` — **PASS**: **16 of 16 tests passed across 3 specs**, at the un-prefixed origin (was 39 across 4 specs).

| Spec | Tests before | Tests now | Passing |
|---|---|---|---|
| `journey.cy.ts` | 10 | 9 | 9 |
| `path.cy.ts` | 9 | 3 | 3 |
| `resource.cy.ts` | 13 | 4 | 4 |
| `navigation.cy.ts` | 7 | deleted | — |

**Manual checks, automated.** The task's `npm run dev` manual list was verified non-interactively against the running container stack with a **temporary** Cypress spec (`cypress/e2e/tmp-f128-verify.cy.ts`), which passed 4/4 and was then deleted along with its screenshots — it is not part of this change (F132 owns the navigation-coverage rewrite). It confirmed:

1. `/paths` and `/resources` no longer resolve to a page (no list heading, empty `v-main` container).
2. The drawer keeps `nav-journey-link` and has no `nav-paths-link` / `nav-resources-link`.
3. `/paths/path-1` and `/resources/resource-1` still render, with the browse links carrying the Discovery `:8080` hrefs above.
4. A logged-in **non-admin** (`cy.login(['mentee'])`) visiting `/admin` is redirected out of the SPA to `http://localhost:8080/discovery/` and never renders the gated page.

Completing a resource with a rating and a note is still covered by `journey.cy.ts` ("should complete a resource in now with rating and note"), which passes. Note that the repo's default `cy.login()` grants the `admin` role, so role-gate checks must pass explicit roles.

**Rating and note pages: confirmed absent.** As the task anticipated, this SPA has **no** rating or note pages and no rating or note routes. Mentees capture a rating and a note inline via `src/components/JourneyCompleteDialog.vue`, reached from `JourneyEditPage.vue`. There was nothing to keep and nothing was created; the complete-with-rating-and-note flow is untouched.

**`npm run test:coverage` (informational — `npm run test` is the gate).** Deleting `useOffsetList.ts` **improved** `src/composables/**` substantially and `src/api/**` now passes comfortably:

| Scope | Statements | Branches | Functions | Lines | Thresholds (S/B/F/L) | Verdict |
|---|---|---|---|---|---|---|
| `src/api/**` | 97% | 82.6% | 100% | 97% | 90 / 75 / 90 / 90 | **passes** |
| `src/composables/**` | 96.74% | 59.57% | 91.66% | 96.74% | 90 / 60 / 90 / 90 | branches short by 0.43 pt |
| `src/components/**` | 0% | 100% | 100% | 0% | 90 / 85 / 90 / 90 | fails (no component tests exist) |

For comparison, F127 recorded `src/composables/**` at 61.02% lines / 58.33% branches / 84.61% functions, so this task moved lines 61.02 → 96.74, functions 84.61 → 91.66, and branches 58.33 → 59.57. The remaining `src/composables/**` branch gap is entirely `useConfig.ts` (51.35% branches) plus an uncovered `useAuth.ts` re-export; `src/components/**` at 0% is unchanged. Both are the **pre-existing** failure F127 documented (verified there as byte-identical on 0.5.7 and 1.0.0) and are out of scope here.

### Files changed

**Updated (10):**

- `src/router/index.ts` — `/resources` and `/paths` list routes removed; role-gate fallback now `window.location.replace(buildJourneyUrl(...JOURNEY_APP_PATHS.home))` + `next(false)`
- `src/App.vue` — `nav-paths-link` and `nav-resources-link` drawer rows removed; everything else (app bar, journey row, admin row, logout, `useAppTitle`, `getMyJourney` query, `provideEditorConfig`) untouched
- `src/api/client.ts` — `getPaths` / `getResources` removed along with the `Path`, `Resource`, and `ListParams` type imports; all other methods and the `Authorization` / `401` / `204` behavior unchanged
- `src/api/types.ts` — `ListParams` removed
- `src/api/Path.client.test.ts` — the two `getPaths` `it`s removed
- `src/api/Resource.client.test.ts` — the two `getResources` `it`s removed
- `src/api/types.test.ts` — `ListParams` describe block and type import removed
- `src/pages/PathViewPage.vue` — Discovery browse link replaces "Back to List"; `useRouter` dropped
- `src/pages/ResourceViewPage.vue` — Discovery browse link replaces "Back to List"; `useRouter` dropped
- `README.md` — Architecture Overview now states this SPA hosts no list dashboards and carries the kept-route table plus the `buildJourneyUrl` note; list-page guidance dropped from "Data Fetching" and "Adding New Features"; `CardGrid` / `ListPageSearch` moved out of the used-components list
- `cypress/e2e/path.cy.ts` — 6 list `it`s removed (3 remain); dead list fixtures, grid selectors, `countGridColumns`, and the broad `**/api/path*` list intercept removed
- `cypress/e2e/resource.cy.ts` — 9 list `it`s removed (4 remain); list selectors and the broad `**/api/resource*` list intercept removed
- `cypress/e2e/journey.cy.ts` — `should navigate to journey from drawer` removed (9 remain)

**Deleted (4):**

- `src/pages/PathsListPage.vue`
- `src/pages/ResourcesListPage.vue`
- `src/composables/useOffsetList.ts`
- `cypress/e2e/navigation.cy.ts`

No changes to `package.json`, `package-lock.json`, `vite.config.ts`, `nginx.conf.template`, `Dockerfile`, `cypress.config.ts`, `vitest.config.ts`, `src/components/**`, or `src/pages/JourneyEditPage.vue`. The spa_utils `1.0.0` pin from F127 is untouched.

### Notes for F129 (`PageFrame` adoption)

- `src/App.vue` still has its own chrome, now shorter: a `v-app-bar` (`nav-drawer-toggle`, `app-bar-title`) plus a `v-navigation-drawer` whose main list holds only `nav-journey-link`, with an appended list holding `nav-admin-link` (`v-if="hasAdminRole"`) and `nav-logout-link`. The script keeps `useRouter().afterEach` closing the drawer, `useAppTitle`, the `getMyJourney` query, `provideEditorConfig`, `useRoles`, and `handleLogout` (which resets the title, calls `logout()`, and `redirectToIdpLogin(`${origin}/`)`).
- `src/App.test.ts` is unchanged and still stubs `RouterView`, `VApp`, `VAppBar`, `VAppBarNavIcon`, `VAppBarTitle`, `VContainer`, `VDivider`, `VList`, `VListItem`, `VMain`, `VNavigationDrawer`, and mocks `@/composables/useConfig`, `@/composables/useRoles`, `vue-router` (`useRouter` → `{ afterEach }` only), `@tanstack/vue-query`, and `useAuth` / `provideEditorConfig` from spa_utils. Swapping in `PageFrame` will need those Vuetify stubs replaced and the `vue-router` mock revisited.
- There is currently **no Cypress coverage of the drawer** — `navigation.cy.ts` is gone and `journey.cy.ts` lost its drawer-navigation `it`. F132 restores navigation coverage against the `PageFrame` ids.

### Follow-ups

1. **`src/composables/**` coverage branch threshold still fails by 0.43 pt** (59.57% vs 60%) even after `useOffsetList.ts` was deleted, and `src/components/**` is still 0%. Both are pre-existing (documented in F127) and structural: no component tests exist, `useAuth.ts` is untested, `useConfig.ts` has 51.35% branch coverage, and the coverage `exclude` list does not exclude `cypress/**` (the E2E specs are counted at 0%). Worth a dedicated task — `src/composables/**` is now within a whisker of green.
2. **`npm run lint` is still missing** (carried over from F127). `npm run build` (`vue-tsc`) remains the type gate.
3. **Detail-page render coverage thinned.** Following the task's rule literally, the two `it`s that rendered a full detail card by clicking through from a list card (`should display a read-only path detail with nested collapsed cards`, `should display a resource in read-only typed editors`) were removed rather than re-pointed, since both visited a list route and both asserted the retired `*-back-to-list-button`. The surviving detail `it`s still exercise the nested-card, admin-card, and aggregation/notes behavior. F132 may want to re-add a direct-visit equivalent that asserts the new `*-browse-*-link` ids at the prefixed origin.
