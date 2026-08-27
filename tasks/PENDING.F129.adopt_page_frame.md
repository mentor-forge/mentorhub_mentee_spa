# F129 – Adopt spa_utils `PageFrame` and delete the local chrome

**Status**: Pending  
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

_Reserved for the task execution agent: plan, commands run, test results, follow-ups._
