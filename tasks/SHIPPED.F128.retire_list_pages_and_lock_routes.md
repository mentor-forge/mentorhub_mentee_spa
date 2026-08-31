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
1. Lock Vue routes to `/` → `/journey`, `/journey`, `/resources/:id`, `/paths/:id`, `/admin`. Role-gate fallback: `buildJourneyUrl('discovery')` + `window.location.replace` + `next(false)`.
2. Delete `PathsListPage.vue`, `ResourcesListPage.vue`, `useOffsetList.ts`, `navigation.cy.ts`.
3. Remove `getPaths` / `getResources` from the API client and `ListParams` from types + its test block. Drop list `it` blocks from Path/Resource client tests.
4. Replace "Back to List" on Path/Resource view pages with Discovery anchors via `buildJourneyUrl`; remove unused `useRouter`.
5. Drop drawer rows `nav-paths-link` / `nav-resources-link` from `App.vue`. Keep journey, admin, logout.
6. Cypress: drop list-dependent `it`s in path/resource specs; drop journey drawer-from-`/paths` `it`; delete `navigation.cy.ts`.
7. README: no list dashboards here; collections live on Discovery; drop `useResourceList` list-page guidance.
8. Record: this SPA has no rating/note detail pages — complete-with-rating-and-note stays on `JourneyCompleteDialog`.
9. Run `npm run test`, `npm run build`, packaging (`container`, `service`, `cypress:run`). Do not commit. Leave Status Pending.

### Summary
Deleted the two CardGrid list dashboards, `useOffsetList`, `getPaths` / `getResources`, `ListParams`, and `navigation.cy.ts`. Vue routes match the locked table (`/` → `/journey`, `/journey`, `/resources/:id`, `/paths/:id`, `/admin`). Role-gate fallback leaves for Discovery via `buildJourneyUrl('discovery')` + `window.location.replace` + `next(false)`. Path/Resource view pages use Discovery browse anchors (`path-view-browse-paths-link`, `resource-view-browse-resources-link`). Drawer no longer has Paths/Resources rows. Collection browsing is documented as Discovery-only.

**Rating/note pages:** this SPA has no rating or note detail pages or routes. Mentees capture a rating and a note inline via `JourneyCompleteDialog` from `JourneyEditPage`. That complete-with-rating-and-note flow is unchanged. No new rating/note routes were added.

### Commands / results
- Grep (`src/`, `cypress/`): no `useOffsetList`, `getPaths`, `getResources`, `ListParams`, `path-list-*`, `resource-list-*`, list `router.push`/`to` for `/paths` or `/resources`
- `npm run test`: **47/47 passed** (10 files; 7 list/`ListParams` `it`s removed)
- `npm run test:coverage`: tests pass; `src/api/**` still above thresholds (97% lines / 82.6% branches / 100% funcs). `src/composables/**` **branches 59.57% vs 60%** — see follow-ups. `src/components/**` 0% is pre-existing (`npm run test` does not enable coverage)
- `npm run build`: **passed** (`vue-tsc` + Vite)
- `npm run api` + `npm run dev` manual smoke: **skipped** (packaging/Cypress used instead; do not bind 8394 twice)
- `npm run container`: **passed**
- `npm run service`: **passed** with `GITHUB_FOREVER_TOKEN` as `GITHUB_TOKEN` and `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html`
- `npm run cypress:run`: **16/16 passed** (journey 9, path 3, resource 4) at the un-prefixed origin

### Follow-ups
- `npm run test:coverage` trips `src/composables/**` branches at **59.57% / 60%**. Deleting untested `useOffsetList.ts` left `useAuth.ts` (re-export, 0%) and `useConfig.ts` (51.35% branches) as the drag. Did not change `vitest.config.ts` (locked). `npm run test` (the required gate) still passes.
- No `npm run lint` script in this repo (same as F127).
- Manual `npm run api` + `npm run dev` smoke (`/`, `/paths`, `/resources`, browse hrefs, drawer, complete+rating+note, non-admin `/admin` → Discovery) was not run; Cypress + container cover the kept routes.
- F129 adopts `PageFrame` (this chrome is temporary). F132 rewrites Cypress for `/mentee/` prefixes and recreates navigation coverage.
