# F129 – Adopt spa_utils `PageFrame` and delete the local chrome

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F128_retire_list_pages_and_lock_routes`  
**Description**: Replace this SPA's local app bar, navigation drawer, and logout handler with the imported `PageFrame`, keeping the dynamic `{full_name}:Mentee` title by binding it to `pageTitle`. Route paths keep the shape F128 locked; the `/mentee/` base path is F130.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — **Universal PageFrame (1.0.0)**: allowed props, the compiled role-gated hamburger catalog, "local nav config is disallowed"; **Cross-SPA URLs**
- `../mentorhub_spa_utils/src/components/PageFrame.vue` — the component being adopted; read it to confirm the markup it owns
- `README.md` — Key Implementation Patterns / Component Architecture
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `tasks/PENDING.F128.retire_list_pages_and_lock_routes.md` — locked route table
- `src/App.vue` — local `v-app-bar` (`app-bar-title`), `v-app-bar-nav-icon` (`nav-drawer-toggle`), `v-navigation-drawer` with `nav-journey-link` / admin / logout rows, the `drawer` ref, the `router.afterEach` drawer close, `handleLogout`, the local `useRoles` / `hasAdminRole` usage, and `<v-main><v-container fluid><router-view /></v-container></v-main>`
- `src/App.test.ts` — mounts `App` shallow with Vuetify chrome stubs (`VAppBar`, `VAppBarNavIcon`, `VAppBarTitle`, `VNavigationDrawer`, `VList`, `VListItem`, `VDivider`, `VMain`, `VContainer`) and asserts the `provideEditorConfig` boundary
- `src/composables/useAppTitle.ts` — module-level `appBarTitle` ref; `setAppBarTitle(fullName)` produces `{full_name}:Mentee` and also writes `document.title`
- `src/composables/useConfig.ts` — app-owned `GET /api/config` startup fetch
- `src/composables/useRoles.ts` — local `hasRole` wrapper; drawer role gating moves into spa_utils
- `src/main.ts`, `src/initAuth.ts` — IdP bootstrap; keep exactly as today
- `src/router/index.ts` — after F128: `/` → `/journey`, `/journey`, `/resources/:id`, `/paths/:id`, `/admin`; role gate already leaves for Discovery
- `src/pages/JourneyEditPage.vue`, `src/pages/PathViewPage.vue`, `src/pages/ResourceViewPage.vue` — each already opens with its own `<v-container>`; `src/pages/AdminPage.vue` delegates to the spa_utils `AdminPage` component

`PageFrame` is exported from the package **root** and already renders `v-app-bar`, the `v-navigation-drawer`, and `v-main` — it does **not** render a `v-container`. The host keeps a single `v-app`. Drawer rows are absolute welcome / ALB `href` values built by `buildJourneyUrl` (targets are usually other SPAs), not Vue Router `to`. Logout is built into the drawer footer (`nav-logout-link`).

**Allowed props only:** `pageTitle` (required). Do **not** pass `navItems`, URL maps, ALB origin, role tables, or extra drawer slots. Do **not** pass `customerName` — that prop only labels the two `customer`-role drawer rows and is not this SPA's concern.

For a mentee token with no catalog role, the compiled hamburger shows exactly **Home** (`/discovery/`) and **Notifications** (`/discovery/notifications`); a token carrying `admin`, `mentor`, or `customer` also gets those role-gated rows. The app-bar avatar links to `/customer/profile/`. That is why no local nav is needed. Drawer hrefs already resolve to the welcome origin on `:8080`, so they are correct before this SPA's nginx serves the prefix and start resolving to this app when F131 ships.

### Keep the dynamic title

Today the app bar shows `{full_name}:Mentee` from `useAppTitle`, driven by the `getMyJourney` query. `pageTitle` is a plain required `string` prop, so bind it reactively — `:page-title="appBarTitle"` — rather than hardcoding the literal `Mentee`. The title logic, the query, and the `document.title` side effect all stay in this repo; only the markup that renders the title moves into `PageFrame` (id `page-frame-title` instead of `app-bar-title`).

### Known limitation to record, not fix

`PageFrame`'s built-in logout returns to `` `${window.location.origin}/` `` — the root origin, not `/mentee/`. That is compiled into spa_utils and cannot be overridden by a host prop. Once F130 mounts the app under the base, a logged-out user lands on the welcome root rather than back at the Mentee SPA, which is acceptable behavior. Record it in **Execution Notes** as a follow-up for a spa_utils issue (base-aware logout return URL). Do **not** re-add a local logout handler to work around it, and do not edit the spa_utils package.

## Goals

- `src/App.vue` becomes a single host `v-app` wrapping `PageFrame`:

  ```vue
  <v-app>
    <PageFrame :page-title="appBarTitle">
      <router-view />
    </PageFrame>
  </v-app>
  ```

  - Remove the local `v-app-bar`, `v-app-bar-title`, `v-app-bar-nav-icon`, `v-navigation-drawer`, all drawer `v-list` rows, the `drawer` ref, the `router.afterEach` drawer close, `handleLogout`, the `useRouter` import if it becomes unused, and the local `useRoles` / `hasAdminRole` usage in this component.
  - The `<v-main>` and the `<v-container fluid>` wrapper are removed too: `PageFrame` owns `v-main`, and every kept page already opens with its own `v-container`. Verify the journey, path detail, resource detail, and admin pages still have sane page gutters after the outer container is gone, and record the result.
  - There must be exactly one app bar and no local hamburger configuration.
- `src/App.vue` keeps everything that is not chrome: the `getMyJourney` query with `enabled: isAuthenticated`, both `watch`es driving `setAppBarTitle` / `resetAppBarTitle`, the existing `provideEditorConfig(config)` call, and the `onMounted` authenticated `loadConfig()` with its `console.warn` on failure. Do not add a second startup config fetch and do not duplicate `provideEditorConfig`.
- No `data-automation-id` beginning with `nav-`, and no `app-bar-title`, is defined anywhere in `src/` any more. The drawer, title, profile, and logout ids come from spa_utils: `nav-drawer-toggle`, `page-frame-title`, `nav-profile-link`, `nav-home-link`, `nav-notifications-link`, `nav-logout-link` (plus `nav-products-link` / `nav-settings-link` / `nav-resources-link` / `nav-paths-link` / `nav-plans-link` / `nav-customer-link` / `nav-customer-members-link` for tokens with those roles).
- `/admin` is no longer reachable from in-app navigation — it stays a direct-URL, `admin`-gated route. The spa_utils `Settings` row targets `/admin/settings` in the **Admin** journey, not this page. Note this in **Execution Notes**; do not add a local drawer row to restore it.
- `src/App.test.ts` still asserts the `provideEditorConfig` boundary and passes: replace the removed Vuetify chrome stubs with a `PageFrame` stub, keep the `RouterView` and `VApp` stubs, and drop the `useRoles` mock if `App.vue` no longer calls it. Do not weaken the enumerator assertions.
- `src/router/index.ts` is unchanged in this task: F128 already pointed the role gate at Discovery, and route paths keep their shape (no renames, no new routes, no base prefix).
- `README.md` records that `PageFrame` from spa_utils 1.0.0 is the navigation shell, that local nav config is disallowed, that the app bar title is bound from `useAppTitle`, and that Cypress uses the spa_utils automation ids listed above.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test` — `src/App.test.ts` must pass with the new stubs; update or remove any other unit test asserting local drawer markup or `handleLogout`
- `npm run build` — `vue-tsc` is the type gate (this repo defines no `lint` script)
- `npm run api` then `npm run dev` — manual check at `http://localhost:8394/`:
  - a single app bar renders, and its title is `{full_name}:Mentee` once the journey loads and `Mentee` before that
  - the hamburger opens the spa_utils drawer; a plain mentee login shows only **Home** and **Notifications**, both as absolute `:8080` URLs
  - an `admin` login additionally shows **Products** and **Settings**
  - the avatar links to `http://<host>:8080/customer/profile/`
  - logout clears auth and leaves via the IdP
  - the journey, `/paths/{id}`, `/resources/{id}`, and `/admin` pages render with reasonable gutters and no doubled app bar

**Packaging verification:**

- `npm run container` — build the SPA container image
- `npm run service` — run db + API + SPA containers
- `npm run cypress:run` — headless end-to-end tests (long running). Expect the `app-bar-title` assertion in `cypress/e2e/journey.cy.ts` to be the one breakage: update that single selector to `page-frame-title` here so the suite stays green. Full drawer and title coverage using the spa_utils ids is **F132** with the rest of the Cypress rewrite.

Do not run `npm run dev` and `npm run service` at the same time — both bind host port **8394**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/App.vue` — `PageFrame` shell, local chrome removed, dynamic `pageTitle` binding
- `src/App.test.ts` — `PageFrame` stub replacing the local chrome stubs
- `cypress/e2e/journey.cy.ts` — `app-bar-title` → `page-frame-title`
- `README.md` — `PageFrame` as the nav shell, spa_utils automation ids, no local nav config

Do not change `src/router/index.ts`, `src/composables/**`, `src/pages/**`, `src/components/**`, `vite.config.ts`, `nginx.conf.template`, `Dockerfile`, `package.json`, `cypress.config.ts`, or `src/api/client.ts` in this task, and do not pass disallowed `PageFrame` props.

## Execution Notes

### Plan

1. Read this task, `tasks/_ORCHESTRATE.md`, `tasks/_PLANNING.md`, `tasks/SHIPPED.F128...` (including its "Notes for F129"), the two standards docs, the spa_utils README ("Universal PageFrame (1.0.0)" / "Cross-SPA URLs"), and `../mentorhub_spa_utils/src/components/PageFrame.vue`. Confirm in the **installed** `node_modules/@mentor-forge/mentorhub_spa_utils@1.0.0` that `PageFrame` is exported from the package root (`dist/components/index.d.ts` → re-exported by `dist/index.d.ts`) and that its compiled template really owns `page-frame-title`.
2. Confirm each kept page opens with its own `<v-container>` before deleting the outer one: `JourneyEditPage.vue`, `PathViewPage.vue`, `ResourceViewPage.vue` do directly, and `src/pages/AdminPage.vue` delegates to the spa_utils `AdminPage` component whose template also starts with `<v-container>`.
3. `src/App.vue`: reduce the template to `v-app` → `PageFrame :page-title="appBarTitle"` → `router-view`. Delete the `v-app-bar`, `v-app-bar-nav-icon`, `v-app-bar-title`, `v-navigation-drawer` and all its rows, `v-main`, `v-container fluid`, the `drawer` ref, `router.afterEach`, `handleLogout`, and the local `useRoles` / `hasAdminRole`. Drop the now-unused imports (`ref`, `useRouter`, `redirectToIdpLogin`, `useRoles`, `logout` from `useAuth`) because `tsconfig.app.json` sets `noUnusedLocals`. Keep the `getMyJourney` query, both `watch`es, `provideEditorConfig`, and the `onMounted` `loadConfig()`.
4. `src/App.test.ts`: swap the eleven Vuetify chrome stubs for `PageFrame`, keeping `RouterView` and `VApp`. Drop the `@/composables/useRoles` mock (no longer called) and the `vue-router` mock plus its `afterEach` spy. Leave the `provideEditorConfig` / `resolveEnumeratorOptions` assertions exactly as they are.
5. `cypress/e2e/journey.cy.ts`: change only the one `app-bar-title` selector to `page-frame-title`.
6. `README.md`: add a "Navigation Shell" pattern section, list `PageFrame` under the spa_utils components, note the `App.vue` role under Component Architecture, and add the spa_utils automation-id table under Automation Support.
7. Verify: `npm run test`, `npm run build`, the required greps, then `npm run container` → `mh up mentee` → `npm run cypress:run`. Automate the task's manual `npm run dev` list with a **temporary** Cypress spec against the container stack, then delete it.

### Commands run

```sh
rg -n 'nav-' src/                                  # no matches
rg -n 'app-bar-title' src/ cypress/                # no matches
rg -n 'v-app-bar|v-navigation-drawer|<v-main' src/ # no matches
rg -n 'handleLogout|useRoles' src/App.vue src/App.test.ts   # no matches
npm run test
npm run build
npm run container
mh down && mh up mentee
curl -s -o /dev/null -w '%{http_code}' http://localhost:8394/            # 200
curl -s -o /dev/null -w '%{http_code}' http://localhost:8394/api/config  # 401 unauthenticated
curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/            # 200
npm run cypress:run
npx cypress run --spec cypress/e2e/tmp-f129-verify.cy.ts    # temporary, deleted after the run
npx cypress run --spec cypress/e2e/tmp-f129-measure.cy.ts   # temporary, deleted after the run
```

### Results

**`npm run test`** — **PASS**: 10 test files, **47 tests passed, 0 failed** — identical to the F128 baseline. `src/App.test.ts` passes with the new stubs and the enumerator assertions untouched.

**`npm run build`** — **PASS**: `vue-tsc` clean, `vite build` succeeded, 651 modules transformed (same count as F128 — `PageFrame` was already in the spa_utils bundle graph). Only the pre-existing >500 kB chunk advisory. `tsconfig.app.json` sets `noUnusedLocals`, so the imports the removed chrome had been using (`ref`, `useRouter`, `redirectToIdpLogin`, `useRoles`, and `logout` off `useAuth`) had to be dropped for the type gate to pass.

**Grep verification** — all required greps return **no matches** (`rg` exit 1):

| Grep | Scope | Result |
|---|---|---|
| `nav-` (any occurrence, not just automation ids) | `src/` | no matches |
| `app-bar-title` | `src/` | no matches |
| `app-bar-title` | `cypress/` | no matches |
| `v-app-bar` / `v-navigation-drawer` / `<v-main` | `src/` | no matches |
| `handleLogout` / `useRoles` | `src/App.vue`, `src/App.test.ts` | no matches |

`src/composables/useRoles.ts` still exists and is still tested (`useRoles.test.ts`, 4 tests) — it is simply no longer consumed by `App.vue`. Nothing outside `App.vue` referenced the deleted chrome, so no other unit test needed updating.

**Packaging.**

- `npm run container` — **PASS**: `ghcr.io/mentor-forge/mentorhub_mentee_spa:latest` rebuilt (required — this change alters the shell).
- `mh down && mh up mentee` — **PASS**: mongodb, mongodb_api, mongodb_spa, mentee_api, mentee_spa, welcome all up. SPA `200` at `http://localhost:8394/`, nginx `/api/` proxy `401` unauthenticated (expected), welcome `200` at `http://localhost:8080/`.
- `npm run cypress:run` — **PASS**: **16 of 16 tests passed across 3 specs**, matching the F128 baseline exactly.

| Spec | Tests | Passing |
|---|---|---|
| `journey.cy.ts` | 9 | 9 |
| `path.cy.ts` | 3 | 3 |
| `resource.cy.ts` | 4 | 4 |
| **Total** | **16** | **16** |

The single anticipated breakage (`app-bar-title` in `journey.cy.ts`) was fixed by updating that one selector to `page-frame-title`; nothing else in the suite touched the chrome.

**Manual checks, automated.** The task's `npm run dev` manual list was verified non-interactively against the running container stack with two **temporary** Cypress specs — `cypress/e2e/tmp-f129-verify.cy.ts` (6/6 passing) and `cypress/e2e/tmp-f129-measure.cy.ts` (1/1, which wrote a metrics report). Both specs, the report file, and the `cypress/screenshots` / `cypress/videos` directories were **deleted** afterwards; they are not part of this change. F132 owns the permanent `PageFrame` navigation coverage.

1. **Exactly one app bar.** `.v-app-bar` has length 1 and `.v-main` has length 1 on `/journey`, `/paths/:id`, `/resources/:id`, and `/admin`. No `[data-automation-id="app-bar-title"]` exists in the served DOM.
2. **Dynamic title.** With the journey response delayed, `page-frame-title` reads exactly `Mentee`; after the response it reads `Jane Mentee:Mentee`, and `document.title` matches — so the `useAppTitle` side effect still fires through the `PageFrame` binding.
3. **Drawer for a plain mentee token** (`cy.login(['mentee'])`) — exactly three rows, in order:

| id | title | href |
|---|---|---|
| `nav-home-link` | Home | `http://localhost:8080/discovery/` |
| `nav-notifications-link` | Notifications | `http://localhost:8080/discovery/notifications` |
| `nav-logout-link` | Logout | (click handler, no href) |

   Explicitly absent: `nav-products-link`, `nav-settings-link`, `nav-resources-link`, `nav-paths-link`, `nav-plans-link`, `nav-customer-link`, `nav-customer-members-link`, and the retired local `nav-journey-link` / `nav-admin-link`.

4. **Drawer for an admin token** (`cy.login(['admin'])`) — five rows, in catalog order:

| id | title | href |
|---|---|---|
| `nav-home-link` | Home | `http://localhost:8080/discovery/` |
| `nav-products-link` | Products | `http://localhost:8080/discovery/products` |
| `nav-notifications-link` | Notifications | `http://localhost:8080/discovery/notifications` |
| `nav-settings-link` | Settings | `http://localhost:8080/admin/settings` |
| `nav-logout-link` | Logout | (click handler, no href) |

   All hrefs resolve to the welcome / ALB origin on **`:8080`**, never the SPA debug port `8394` — `resolveAlbOrigin()` correctly rewrites `8394` → `8080`.

5. **Avatar.** `nav-profile-link` points at `http://localhost:8080/customer/profile/` for both the mentee and the admin token, and wraps a `.v-avatar` (`mdi-account`, since the Cypress JWT carries no `picture` claim).
6. **Logout.** Clicking `nav-logout-link` clears `access_token` and `user_roles` from `localStorage` and leaves via the IdP with `location.replace`, landing on `login.html?return_to=http://localhost:8394/`. (The dev IdP URL was intercepted to a same-origin `login.html` for the duration of that one temporary test so Cypress could follow the redirect; the real container value is the Tailscale MagicDNS host `http://m5max.tailb0d293.ts.net:8080/login.html`.) Note the `return_to` is the **root origin** — see "Known limitation" below.

**Page gutters after removing `<v-main>` and `<v-container fluid>` — verified sane.** Measured computed styles at a 1000 px viewport on the container build:

| Route | `.v-app-bar` count | `.v-main` padding-top | page `.v-container` padding | container max-width |
|---|---|---|---|---|
| `/journey` | 1 | 64px | 16px all round | 900px |
| `/paths/path-1` | 1 | 64px | 16px all round | 900px |
| `/resources/resource-1` | 1 | 64px | 16px all round | 900px |
| `/admin` | 1 | 64px | 16px all round | 900px |

Each route renders exactly one `.v-main > .v-container`. The 64px `padding-top` is Vuetify's app-bar offset applied by `PageFrame`'s `v-main`, so content still clears the bar. Because the outer `<v-container fluid>` is gone, the page-level containers are now the outermost container and get Vuetify's default (non-fluid) `max-width` breakpoint — content is centred at 900px on a 1000px viewport instead of spanning full width. That is a deliberate, better-looking result (the old markup nested a non-fluid container inside a fluid one, which double-padded to 32px), and it matches how the other journey SPAs render under `PageFrame`. No page lost its gutters and nothing is flush against the viewport edge.

**`/admin` is no longer reachable from in-app navigation.** The spa_utils hamburger catalog has no row for this SPA's runtime-config viewer — its `Settings` row targets `/admin/settings` in the **Admin** journey (`http://localhost:8080/admin/settings`), a different app. As the task instructs, no local drawer row was added to restore it: `/admin` is now a **direct-URL-only**, `admin`-gated route. The router's `requiresRole: 'admin'` gate is unchanged and still redirects a role-less user out to the Discovery journey home (F128 behavior, re-confirmed green in `path.cy.ts` / `resource.cy.ts` non-admin tests).

**`PageFrame` props.** Only `pageTitle` is passed, bound reactively as `:page-title="appBarTitle"`. No `navItems`, URL map, ALB origin, role table, extra drawer slot, or `customerName` — the two `customer`-role rows are not this SPA's concern and never render for a mentee token.

**Behavior intentionally not carried over.** The old local chrome closed the drawer on every route change via `router.afterEach`. `PageFrame` owns its own `drawer` ref and does not watch the router, but because every drawer row is an absolute cross-SPA `href` (a full page load), there is no in-app navigation left that could leave the drawer open — the `temporary` drawer's scrim click still closes it. `App.vue` therefore no longer imports `vue-router` at all.

### Known limitation recorded (not fixed)

`PageFrame`'s built-in logout returns to `` `${window.location.origin}/` `` — the **root** origin. Verified live: `return_to=http://localhost:8394/`. This is compiled into spa_utils and cannot be overridden by a host prop. Once F130 mounts this app under `base: '/mentee/'`, a logged-out user will land on the welcome root rather than back at the Mentee SPA. Per the task this is acceptable and was **not** worked around with a local logout handler, and the spa_utils package was not edited. See follow-up 1.

### Files changed

**Updated (4) — exactly the task's Outputs, nothing else:**

- `src/App.vue` — now a single host `v-app` wrapping `PageFrame :page-title="appBarTitle"` around `router-view`. Removed the `v-app-bar`, `v-app-bar-nav-icon`, `v-app-bar-title`, `v-navigation-drawer` and all rows, `v-main`, `v-container fluid`, the `drawer` ref, `router.afterEach`, `handleLogout`, `hasAdminRole`, and the `ref` / `useRouter` / `redirectToIdpLogin` / `useRoles` / `logout` imports. Kept the `getMyJourney` query with `enabled: isAuthenticated`, both `watch`es, the single `provideEditorConfig(config)` call, and the `onMounted` authenticated `loadConfig()` with its `console.warn`.
- `src/App.test.ts` — the eleven Vuetify chrome stubs replaced by `PageFrame` (keeping `RouterView` and `VApp`); the `@/composables/useRoles` mock and the `vue-router` mock plus its `afterEach` spy removed. The `provideEditorConfig` / `resolveEnumeratorOptions` enumerator assertions are byte-identical.
- `cypress/e2e/journey.cy.ts` — one selector: `app-bar-title` → `page-frame-title`.
- `README.md` — new "Navigation Shell" section under Key Implementation Patterns (`PageFrame` as the shell, `pageTitle`-only props, local nav config disallowed, no `v-container` in the shell, `/admin` direct-URL only); `PageFrame` added to the spa_utils component list; an "App shell" bullet under Component Architecture; and a spa_utils automation-id table under Automation Support.

**Deleted:** the two temporary Cypress specs described above (`cypress/e2e/tmp-f129-verify.cy.ts`, `cypress/e2e/tmp-f129-measure.cy.ts`), plus `cypress/tmp-f129-report.json` and the `cypress/screenshots` / `cypress/videos` directories. `cypress/e2e/` is back to exactly `journey.cy.ts`, `path.cy.ts`, `resource.cy.ts`.

No changes to `src/router/index.ts`, `src/composables/**`, `src/pages/**`, `src/components/**`, `vite.config.ts`, `nginx.conf.template`, `Dockerfile`, `package.json`, `package-lock.json`, `cypress.config.ts`, `vitest.config.ts`, or `src/api/client.ts`. The spa_utils `1.0.0` pin from F127 is untouched, and the spa_utils package itself was not edited. No `/mentee/` prefix was introduced anywhere.

### Notes for F130 (Vite `base: '/mentee/'`)

Two concrete traps found while reading the bootstrap:

1. **The runtime-config injection is hardcoded to the root path.** `vite.config.ts`'s `injectRuntimeConfig()` plugin injects a literal `<script src="/runtime-config.js"></script>` into `index.html`, and `nginx.conf.template` serves it from `location = /runtime-config.js`. Under `base: '/mentee/'` the browser would request `<origin>/runtime-config.js` — which welcome nginx owns, not this SPA — so `window.__MENTORHUB_RUNTIME__.IDP_LOGIN_URI` would be undefined and `redirectToIdpLogin` would silently fall back to `DEVELOPER_EDITION_IDP_LOGIN_URI` (`http://127.0.0.1:8080/login.html`). F130 must make the injected `src` base-aware **and** move the nginx `location =` block (and the `try_files` fallback in `location /`) under the prefix. The `envsubst` step in the `Dockerfile` CMD writes `runtime-config.js` next to `index.html` in the docroot, so it moves with the docroot layout, not with the URL.
2. **`PageFrame` builds every URL from `resolveAlbOrigin()`, which ignores `import.meta.env.BASE_URL`.** Drawer rows, the avatar, and the logout `return_to` are `{albOrigin}/{journey}/{path}` or `{origin}/` — none of them read the Vite base. Verified live from the container on port 8394: hrefs resolve to `http://localhost:8080/...` (`resolveAlbOrigin` rewrites the debug port `8394` → `8080`), which is exactly right and needs no change from F130. But it also means **`PageFrame` will never produce a `/mentee/`-prefixed URL**, so F130 does not need to (and cannot) coordinate the base with the shell — the only base-sensitive logout concern is the root-origin `return_to` in follow-up 1.

Also relevant: `src/router/index.ts` still has `createWebHistory()` and `redirectToIdpLogin(window.location.origin + to.fullPath)` (both F130's to change); `index.html` references `/vite.svg`, which Vite rebases automatically; `src/initAuth.ts` calls `bootstrapAuthFromUrl()` then `syncAuthFromStorage()` at module scope before the app mounts, and is base-agnostic.

### Follow-ups

1. **spa_utils issue — base-aware logout return URL.** `PageFrame.handleLogout()` hardcodes `` `${window.location.origin}/` `` as the IdP `return_to`. A host SPA mounted under a Vite `base` (this SPA after F130) cannot get the user returned to its own entry point, and there is no prop to override it. Suggested fix in spa_utils: default `return_to` to `window.location.origin + (import.meta.env.BASE_URL ?? '/')`, or accept an optional `logoutReturnTo` prop. Confirmed live: `return_to=http://localhost:8394/`. Recorded, not worked around — no local logout handler was re-added.
2. **`/admin` has no navigation entry point.** By design this task left the runtime-config viewer direct-URL only. If it should be discoverable, the right move is a spa_utils change (a mentee-journey or per-journey config row in the hamburger catalog), not a local drawer row.
3. **Drawer close on route change is gone** (see "Behavior intentionally not carried over"). Harmless today because every catalog row is a full-page cross-SPA navigation. If spa_utils ever adds an in-app `to` row, `PageFrame` will need its own `router.afterEach`.
4. **`npm run test:coverage` still fails — pre-existing and unchanged by this task.** `npm run test` (47/47) is the gate and passes. `src/components/**` remains 0% (no component tests exist) and `src/composables/**` branches remain short of the 60% threshold. This task added and removed no composable and no component, so neither number moved. Both failures are the structural issue documented in F127 and F128 and were not chased here. (`src/composables/useRoles.ts` is unaffected — `App.vue` stopped calling it, but `src/pages/PathViewPage.vue` and `src/components/ResourceViewCard.vue` still do, and its 4 unit tests still run.)
5. **`npm run lint` is still missing** (carried from F127/F128). `npm run build` (`vue-tsc`) remains the type gate.
