# F133 – Pin `@mentor-forge/mentorhub_spa_utils@1.0.1`

**Status**: Shipped  
**Type**: Feature  
**Depends On**: _(none — first task in this wave)_  
**Description**: This repo owns the Mentee SPA **1.0.1 pin** (issue F-ES11 / GitHub #33). Bump `@mentor-forge/mentorhub_spa_utils` from exact `1.0.0` to exact **`1.0.1`**, refresh the lockfile from CodeArtifact, and fix any compile or unit-test breakage from the 1.0.1 catalog, logout `return_to=/discovery/`, Settings `hostingConfigHref`, and Token claims. Do **not** add `/config` in this task.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — exact semver pins for shared packages; CodeArtifact (`mh` then `npm install`)
- `../mentorhub_spa_utils/README.md` — install pin **1.0.1**; **Universal PageFrame** (1.0.1 catalog: Home, Events, Resources, Paths, Plans; Notifications + Settings **admin-only**; Settings = `hostingConfigHref()` → `{origin}/{prefix}/config`; empty/missing roles → Home + Events); logout `logout()` then `redirectToIdpLogin(buildJourneyUrl('discovery'))` → `/discovery/`; **Admin config and Token claims**; removed hamburger ids `nav-products-link`, `nav-customer-link`, `nav-customer-members-link`; new `nav-events-link`
- `README.md` — currently documents spa_utils **1.0.0**, `/mentee/admin` as the admin host, and admin hamburger rows `nav-products-link` / `nav-settings-link`; Automation Support still lists Products / Customer / Customer Members
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `package.json` / `package-lock.json` — currently `"@mentor-forge/mentorhub_spa_utils": "1.0.0"`
- `src/App.vue` — `PageFrame` with `:page-title="appBarTitle"` only (keep; do not add `navItems`, ALB URLs, or role tables)
- `src/initAuth.ts` — `bootstrapAuthFromUrl()` then `syncAuthFromStorage()` (keep)
- `src/pages/AdminPage.vue` — already imports `{ AdminPage }` from spa_utils (do not change the host wrapper here)
- `src/router/index.ts` — `/admin` is still the only admin route; `/config` is **F134**
- `cypress/e2e/navigation.cy.ts` — still encodes the **1.0.0** catalog (mentee Home + Notifications; admin Products + Settings → `/admin/settings`; logout comment that `return_to` is the root origin)
- `vitest.config.ts` — inlines `@mentor-forge/mentorhub_spa_utils`; no version comment to update unless 1.0.1 changes the inline setting

**Source issue**: F-ES11 ("Pin spa_utils 1.0.1 and host AdminPage at /mentee/config"). This task delivers **only** the pin.

**External prerequisite**: `mentorhub_spa_utils` F041–F046 shipped and **`@mentor-forge/mentorhub_spa_utils@1.0.1` is published to CodeArtifact**. Vue `base` + SPA nginx prefix `/mentee/` are already shipped (F130–F132 / mentorhub L022). Run `mh`, then `npm view @mentor-forge/mentorhub_spa_utils version`. If **1.0.1** is not available, set this task **Status** to `Blocked`, rename the file to `BLOCKED.F133.pin_spa_utils_1_0_1.md`, and stop — do not stay on `1.0.0` and do not point `package.json` at a git URL.

This SPA is the **first** `mentorhub_mentee_spa` issue in the 1.0.1 wave and **owns this repo’s pin**. Sibling SPAs pin independently; do not change other repos.

**Out of scope**: Vue `/config` (F134). Cypress catalog / Settings / Token / logout `return_to` assertions (F135). Do not pass `navItems`, ALB origins, or role tables into `PageFrame`. Do not override logout locally. Do not restore Products / Customer / Customer Members drawer rows. Do not add list dashboards.

### Wave ordering

Pin (F133) → config route (F134) → Cypress and packaging (F135). Pinning first makes the 1.0.1 `PageFrame` catalog, `hostingConfigHref()`, Token claim labels, and logout `return_to` available before F134 registers the Settings destination. Cypress still encodes the 1.0.0 catalog, so **do not run** `npm run cypress:run` here.

## Goals

- `package.json` pins `"@mentor-forge/mentorhub_spa_utils": "1.0.1"` — exact semver, **no caret**.
- `package-lock.json` resolves `1.0.1` from the CodeArtifact registry after `mh` and `npm install --include=dev`.
- `npm ls @mentor-forge/mentorhub_spa_utils` reports `1.0.1`.
- The app still builds and unit-tests: `PageFrame` still receives only `pageTitle` (`:page-title="appBarTitle"`). IdP bootstrap / `urlAuthBootstrap` / `redirectToIdpLogin` stay as today. Logout `return_to` remains owned by spa_utils — do not add a local logout handler and do not re-introduce `handleLogout`.
- `README.md` names the pinned version **1.0.1** in ownership / component notes. Document the 1.0.1 hamburger catalog in prose (Home, Events, Resources, Paths, Plans; Notifications and Settings **admin-only**; Settings lands on this SPA’s `/config` once F134 ships; Products / Customer / Customer Members are **not** hamburger rows). Do not invent a local nav config API. Do not claim `/mentee/config` is already routed — F134 owns that row in the In-App Route Table.
- Fix any `src/**` import or type breakage from 1.0.1. Do not add routes in this task. Keep existing journey, path, and resource detail pages.
- `vitest.config.ts` may be touched **only** if 1.0.1 changes whether the package must be inlined for Vitest. Do not change coverage thresholds.
- The three spa_utils Cypress subpath imports still resolve under 1.0.1: `cypress/jwtDefaults`, `cypress/registerJwtSignTask`, and `cypress/registerAuthCommands`. If a subpath or option name moved, update the import here — do **not** vendor a local copy. Do not rewrite `navigation.cy.ts` catalog expectations here.

### Craftsmanship Expectations

- Reuse `mentorhub_spa_utils` for shared SPA behavior rather than creating local equivalents.
- Treat DRY as avoiding duplicated knowledge: catalog, logout `return_to`, and Settings href are owned by 1.0.1 `PageFrame` / `hostingConfigHref` / `buildJourneyUrl`. Do not grow a parallel hamburger.
- Keep journey-specific behavior in this SPA; do not restore Products / Customer / Members drawer rows locally.
- Prefer deleting obsolete local behavior when responsibility has moved to spa_utils. Do not introduce local workarounds for 1.0.1 catalog or logout.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `mh` (CodeArtifact auth) then `npm install --include=dev`
- `npm ls @mentor-forge/mentorhub_spa_utils` — confirm **1.0.1**
- `npm run test` — full Vitest suite, including `src/App.test.ts`
- `npm run test:coverage` — the `src/api/**`, `src/composables/**`, and `src/components/**` thresholds in `vitest.config.ts` must still hold
- `npm run build` — `vue-tsc` must be clean. **This repo defines no `lint` script**, so `npm run build` is the type gate. Do not add a lint script in this task.

Do **not** run `npm run cypress:run` in this task. Existing Cypress still encodes the 1.0.0 catalog (`nav-products-link`, Settings → `/admin/settings`, mentee Notifications, logout to root origin). Leave those specs to F135. Do not “fix” them here unless a unit test or `vue-tsc` fails.

Packaging (`npm run container` / `npm run service`) is **F135**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `package.json` — `"@mentor-forge/mentorhub_spa_utils": "1.0.1"`
- `package-lock.json` — resolved 1.0.1 from CodeArtifact
- `README.md` — spa_utils version note and 1.0.1 catalog ownership (do not add `/mentee/config` to the route table yet)
- `vitest.config.ts` — only if 1.0.1 requires a change to the inline setting
- `cypress.config.ts`, `cypress/support/e2e.ts` — only if a spa_utils Cypress subpath or option moved in 1.0.1
- Any `src/**` import or type that fails to compile against 1.0.1

Do not add a `/config` route. Do not pass disallowed `PageFrame` props. Do not change Cypress specs in this task unless a compile of test helpers breaks. Do not change `src/router/index.ts`, `vite.config.ts`, `nginx.conf.template`, or `Dockerfile`.

## Execution Notes

**Plan**
1. Confirm `@mentor-forge/mentorhub_spa_utils@1.0.1` is published (`mh`, then `npm view`). If not, mark Blocked and stop.
2. Pin `package.json` to exact `"1.0.1"` (no caret) and refresh the lockfile with `npm install --include=dev`.
3. Confirm `npm ls` reports 1.0.1.
4. Update `README.md` version notes and 1.0.1 hamburger catalog prose. Do not add `/mentee/config` to the In-App Route Table.
5. Fix only compile/unit-test breakage from 1.0.1 (src imports/types, Cypress helper subpaths if they moved). Do not add `/config`, do not pass disallowed `PageFrame` props, do not rewrite `navigation.cy.ts`.
6. Run `npm run test`, `npm run test:coverage`, `npm run build`. Do not run Cypress, container, or service.

**Out of scope this task**: F134 `/config` route; F135 Cypress catalog / packaging.

**Summary**
Pinned `@mentor-forge/mentorhub_spa_utils` to exact **1.0.1** (no caret). Lockfile resolves `mentorhub_spa_utils-1.0.1.tgz` from CodeArtifact. `npm ls` reports `1.0.1`. Prerequisite `mh` + `npm view` returned `1.0.1` (published).

No `src/**` compile or type breakage. Cypress subpaths (`cypress/jwtDefaults`, `cypress/registerJwtSignTask`, `cypress/registerAuthCommands` + `visitPath`) are unchanged in 1.0.1 — no Cypress file edits. `vitest.config.ts` inline setting unchanged. `PageFrame` still receives only `:page-title="appBarTitle"`. No `/config` route added. README names 1.0.1 and documents the compiled hamburger catalog (Home, Events, Resources, Paths, Plans; Notifications + Settings admin-only; Settings `hostingConfigHref()` lands on `/config` once F134 ships; Products / Customer / Customer Members are not rows). Logout `return_to` remains owned by spa_utils.

**Test results**
- `mh` then `npm view @mentor-forge/mentorhub_spa_utils version`: **1.0.1**
- `npm install --include=dev`: passed (changed 1 package)
- `npm ls @mentor-forge/mentorhub_spa_utils`: `@mentor-forge/mentorhub_spa_utils@1.0.1`
- `npm run test`: **pass** — 10 files, 47 tests
- `npm run test:coverage`: tests **pass** (47/47); command **exits nonzero** on pre-existing thresholds unchanged by this pin — `src/composables/**` branches **59.57% / 60%**, `src/components/**` lines/statements **0% / 90%**. Same numbers recorded in F128. Did not change `vitest.config.ts` (locked). `src/api/**` still above thresholds (97% lines / 82.6% branches / 100% funcs).
- `npm run build`: **pass** — `vue-tsc` clean, Vite production build succeeded

**Follow-ups**
- F134 hosts `AdminPage` at `/config` (Settings destination).
- F135 rewrites Cypress catalog / Settings / Token / logout `return_to` and packaging.
- Coverage threshold miss is pre-existing (F128); not introduced by 1.0.1.
