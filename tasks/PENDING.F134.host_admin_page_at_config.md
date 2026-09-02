# F134 – Host packaged `AdminPage` at `/mentee/config`

**Status**: Pending  
**Type**: Feature  
**Depends On**: `F133_pin_spa_utils_1_0_1`  
**Description**: Register Vue `path: '/config'` under the existing journey `base` so Settings (`hostingConfigHref()`) lands on **this** SPA at `/mentee/config`. Reuse the existing packaged `AdminPage` wrapper. Gate the route with the **admin** role; non-admins redirect away. Keep existing journey, path, and resource detail pages. Do not pass nav config into `PageFrame`.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — **Universal PageFrame**: Settings is **admin-only** and uses `hostingConfigHref()` → `{origin}/{journeyPrefix}/config` (not `/admin/settings`, not welcome-port rewrite). **Admin config and Token claims**: Token tab ids `admin-token-profile-id-display`, `admin-token-customer-id-display`, `admin-token-mentor-id-display`
- `README.md` — In-App Route Table currently lists `/mentee/admin` only
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/router/index.ts` — `/admin` already loads `src/pages/AdminPage.vue` with `requiresAuth` + `requiresRole: 'admin'`; missing role calls `window.location.replace(buildJourneyUrl('discovery'))` then `next(false)`; there is **no** catch-all (unmatched paths stay in Vue Router, they do not forward to Discovery)
- `src/pages/AdminPage.vue` — already imports `{ AdminPage }` from `@mentor-forge/mentorhub_spa_utils` and feeds `GET` config via `api.getConfig()`
- `src/App.vue` — `PageFrame` with `:page-title="appBarTitle"` only
- `src/initAuth.ts` — keep IdP bootstrap / `urlAuthBootstrap` as today
- `vite.config.ts` — `base: '/mentee/'` already shipped (F130); Vue `path: '/config'` is browser URL `/mentee/config`

spa_utils 1.0.1 compiles Settings to **this** SPA’s `/mentee/config` on the **current origin** (Vite/container `:8394` during Cypress; welcome `:8080` when entered through ALB). The hamburger must not be given local `navItems`. Do not hard-code ALB URLs or role tables on `PageFrame`.

F128 locked `/admin` as the config-viewer path so that 1.0.0 wave would not churn Cypress. **F-ES11 supersedes that lock:** Settings now lands on hosting `/config`, so this task adds `path: '/config'`. Keep `/admin` working as an alias or redirect so existing bookmarks do not 404 before F135.

Issue F-ES11 says to keep journey, rating, and note detail pages. This repo has **no** rating or note pages — mentees capture a rating and a note inline in `JourneyCompleteDialog.vue`. Preserve that flow. Do **not** invent new rating or note routes.

**Out of scope**: Cypress click-through, Token tab, catalog rows, logout `return_to`, and non-admin redirect coverage (F135). Do not add Events or any list dashboard. Do not change the spa_utils pin.

## Goals

- Vue route `path: '/config'` (public URL **`/mentee/config`** under existing Vite `base` `/mentee/`) renders the existing packaged `AdminPage` wrapper. Import remains `{ AdminPage }` from `@mentor-forge/mentorhub_spa_utils`. Do not duplicate the prefix inside the route `path` (that would produce `/mentee/mentee/config`).
- Gate `/config` with the **admin** role using the same `requiresRole: 'admin'` pattern as `/admin`. Unauthenticated callers still hit IdP via the existing `requiresAuth` guard (`redirectToIdpLogin`). Authenticated non-admins redirect away via the existing `window.location.replace(buildJourneyUrl('discovery'))` fallback — do not invent a local Home page to absorb the gate, and do not send them to `/journey`.
- Keep `/admin` working so existing bookmarks do not 404 before F135: either an **alias** of `/config` or a redirect to `{ name }` of the config route. Do not keep two different admin page implementations.
- Keep existing journey, path, and resource detail pages and routes (`/`, `/journey`, `/resources/:id`, `/paths/:id`). Config route only — no new list dashboards, no Events route, no Products / Customer / Members pages.
- Do **not** pass `navItems`, ALB URLs, or role tables into `PageFrame`. Settings is already in the compiled 1.0.1 catalog (`hostingConfigHref()` → `{origin}/mentee/config`).
- README In-App Route Table includes `/mentee/config` as the admin Settings host (Token / Config Items / Versions / Enumerators). Note that hamburger Settings stays on the hosting origin (no `:8080` rewrite). `/mentee/admin` may remain listed as an alias.
- No new local admin chrome. Token claim labels/ids are owned by spa_utils 1.0.1 `TokenClaimsCard`. Do not restore Products / Customer / Customer Members hamburger rows locally.

### Craftsmanship Expectations

- Reuse the packaged `AdminPage`; do not fork Config/Token UI locally.
- Treat DRY as avoiding duplicated knowledge: the Settings href is `hostingConfigHref()`, not a Mentee-owned URL table and not `/admin/settings`.
- Prefer deleting a second admin page if `/admin` and `/config` would otherwise diverge.
- Keep journey-specific detail pages in this SPA; do not reintroduce collection lists that belong on Discovery.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test`
- `npm run test:coverage` — thresholds unchanged
- `npm run build` — `vue-tsc` is the type gate (this repo defines no `lint` script)

Do not add Cypress here (F135). Router unit tests are optional; pages remain E2E-covered in F135. If a router test is added, cover: admin can resolve `/config`; authenticated non-admin `requiresRole` does not stay on `/config` (existing Discovery fallback is correct). Do not weaken `src/App.test.ts` enumerator / `provideEditorConfig` assertions.

Optional smoke (`npm run api` then `npm run dev` at `http://localhost:8394/mentee/`): an admin token can open `/mentee/config`; a mentee-only token is sent away; `/mentee/journey`, `/mentee/paths/{id}`, and `/mentee/resources/{id}` still render. Do not treat this as a substitute for F135.

Do not run `npm run dev` and `npm run service` at the same time — both bind host port **8394**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/router/index.ts` — `/config` (admin-gated); `/admin` alias or redirect to config
- `src/pages/AdminPage.vue` — only if the wrapper must change to stay a single host for both paths
- `README.md` — `/mentee/config` as the Settings / AdminPage host; `/admin` alias if kept
- A colocated router unit test **only if** one is added for the `/config` role gate

Do not add Events or list pages. Do not pass disallowed `PageFrame` props. Do not change the spa_utils pin. Do not rewrite `cypress/e2e/navigation.cy.ts` in this task.

## Execution Notes

_Reserved for the task execution agent._
