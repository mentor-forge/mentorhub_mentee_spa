# F135 – 1.0.1 catalog, `/mentee/config` Cypress and packaging

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F134_host_admin_page_at_config`  
**Description**: Point Cypress at the spa_utils **1.0.1** hamburger catalog, prove Settings opens this SPA’s `/mentee/config`, cover Token claims, admin-gate `/config`, and verify logout `return_to=/discovery/`. Run the packaged SPA as the acceptance gate for F-ES11.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — E2E covers pages; automation ids are a stable UI API
- `../mentorhub_spa_utils/README.md` — **Universal PageFrame (1.0.1)**: catalog table; removed ids `nav-products-link`, `nav-customer-link`, `nav-customer-members-link`; new `nav-events-link`; kept `nav-settings-link` whose href is `hostingConfigHref()` (hosting origin, **no** `:8080` rewrite); Notifications + Settings **admin-only**; empty/missing roles → Home + Events; logout `return_to` = `buildJourneyUrl('discovery')` → `/discovery/`; Token tab ids `admin-token-profile-id-display`, `admin-token-customer-id-display`, `admin-token-mentor-id-display`
- `README.md` — Testing / Automation Support still describe 1.0.0 admin rows (`nav-products-link`) and treat Notifications as a mentee row
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `cypress.config.ts` — `baseUrl` stays `http://localhost:8394`
- `cypress/support/e2e.ts` — `registerAuthCommands({ visitPath: '/mentee/' })`
- `cypress/support/commands.ts` — `visitPrefixed`
- `cypress/e2e/navigation.cy.ts` — still encodes the **1.0.0** catalog: mentee rows are Home + Notifications; admin rows include Products and Settings → `/admin/settings` via `assertAlbHref`; logout only asserts `return_to` is present and comments that PageFrame returns to the **root** origin
- `cypress/e2e/deployment.cy.ts` — nginx prefix / API proxy; keep (no catalog rewrite unless a selector breaks)
- `cypress/e2e/journey.cy.ts`, `cypress/e2e/path.cy.ts`, `cypress/e2e/resource.cy.ts` — prefixed detail coverage; keep
- `src/router/index.ts` — `/config` (F134), existing detail routes; role-gate uses `window.location.replace(buildJourneyUrl('discovery'))` (cross-origin `:8080/discovery/`)

Cypress runs against **8394**. Collection hamburger `href`s from `buildJourneyUrl` still include **`:8080`**. **Settings is the exception:** `hostingConfigHref()` stays on the current origin (`http://localhost:8394/mentee/config`), not welcome `:8080`, and not `/admin/settings`.

This SPA does **not** host Events. `nav-events-link` is a Discovery ALB href (`http://localhost:8080/discovery/events`). Assert the `href`; do not follow it and do not add `/events` here.

`/` → `/journey` is still a same-SPA redirect, so `visitPath: '/mentee/'` remains valid. Prefer `cy.visitPrefixed` for in-app routes other than the login seed.

`npm run dev` and `npm run service` both bind host port **8394**. Cypress runs against `npm run service`.

`cy.login()` with no argument seeds an **admin** token. Use `cy.login(['mentee'])` for the least-privileged catalog (Home + Events, **not** Notifications/Settings). Use `cy.login(['admin'])` for Settings. Pick roles deliberately — do not assert “only two rows exist” against a default `cy.login()`.

## Goals

- **Catalog (mentee-only login):** ordered rows are Home and Events. `nav-notifications-link` and `nav-settings-link` are **absent**. Home `href` is welcome `:8080/discovery/`. Events `href` is welcome `:8080/discovery/events`. Profile avatar still targets `/customer/profile/` on `:8080`.
- **Catalog (admin-only login):** Home, Events, Notifications, Settings. Mentor browse rows (`nav-resources-link`, `nav-paths-link`, `nav-plans-link`) are absent. Notifications `href` is `:8080/discovery/notifications`. **Settings** `href` is `http://localhost:8394/mentee/config` (hosting origin). Assert **before** click: includes `:8394`, does **not** include `:8080`, does **not** include `/admin/settings`, does **not** include `/mentee/mentee`. Clicking it stays on this SPA at pathname `/mentee/config`.
- **Removed hamburger rows:** `nav-products-link`, `nav-customer-link`, and `nav-customer-members-link` are **absent** for every role checked (admin, mentee, and at least one other least-privileged login if used). Do not restore them locally.
- **Notifications and Settings only for `admin`.** A mentee-only login must **not** show those rows. Events is visible for authenticated users including mentee.
- **Token tab:** after admin Settings navigation, stub `GET /mentee/api/config` (or `**/mentee/api/config`) with a `token` object carrying `profile_id`, `customer_id`, and `mentor_id`. Open the Token tab (`admin-tab-token`) and assert `admin-token-profile-id-display`, `admin-token-customer-id-display`, `admin-token-mentor-id-display` (read-only input values, matching spa_utils `TokenClaimsCard`).
- **Config gate:** a login **without** `admin` visiting `/mentee/config` must **not** remain on that path showing AdminPage. The existing guard calls `window.location.replace(buildJourneyUrl('discovery'))` (cross-origin `:8080/discovery/`). Cypress cannot follow that the way it follows same-origin Home — prove the negative at the boundary: pathname is no longer `/mentee/config` and Token/config chrome is not shown. If the browser unloads toward `:8080/discovery/`, that is success. Do **not** add a local Home or `/journey` fallback to make the test easier. An admin visit stays on `/mentee/config`.
- **Logout:** after `nav-logout-link`, IdP stub still loads and `return_to` is welcome origin `http://localhost:8080/discovery/` — not a hardcoded `127.0.0.1` SPA URL, not bare `/` as the only path, not `/mentee/` as the return. Update or delete the F129/F132 comment that treated missing `/discovery/` as a spa_utils limitation.
- Existing prefix / API / drawer-close / unauthenticated-deep-link / runtime-config / title coverage in `navigation.cy.ts` still passes. Detail specs (`journey`, `path`, `resource`) and `deployment.cy.ts` still pass; touch them only if a 1.0.1 catalog id or `/admin` vs `/config` assertion breaks.
- `/admin` may still resolve if F134 kept an alias; prefer asserting `/mentee/config` as the Settings host.
- No `/mentee/mentee` in `cy.url()` or `href`.
- `README.md` Testing / Automation Support lists 1.0.1 ids: Events for authenticated users; Notifications + Settings **admin-only**; Settings → hosting `/mentee/config`; Products / Customer / Customer Members absent.

### Craftsmanship Expectations

- Use spa_utils PageFrame automation ids; do not invent a local drawer.
- Assert Settings at the layer that owns it (`hostingConfigHref` on the current origin) and Events/Home at the layer that owns them (`buildJourneyUrl` on welcome `:8080`). A test that only checks the final page without the href origin would miss a `:8080` rewrite bug on Settings.
- Do not restore Products / Customer / Members rows, or mentee Notifications, to make an old assertion pass.
- Keep journey-specific detail specs intact; this task is catalog + config + logout, not a CRUD rewrite.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test`
- `npm run test:coverage`
- `npm run build` — `vue-tsc` is the type gate (this repo defines no `lint` script; record the missing `npm run lint` from issue acceptance criteria as a follow-up rather than adding tooling)

**Packaging verification** (required — last task of the F-ES11 / 1.0.1 set):

- `npm run container` — build the SPA container image
- `npm run service` — run db + API + SPA containers
- `npm run cypress:run` — headless end-to-end tests (long running); **all** specs must pass against `http://localhost:8394/mentee/...`

Do not run `npm run dev` and `npm run service` at the same time — both bind host port **8394**.

Record results in **Execution Notes**. The gate that would look correct while bypassing the intended boundary is: Settings `href` rewritten to `:8080` or `/admin/settings`; a non-admin remaining on `/mentee/config`; or logout `return_to` pointing at SPA root `/` instead of `/discovery/`. Include those negative assertions.

Env notes from prior waves: `GITHUB_FOREVER_TOKEN` as `GITHUB_TOKEN` if the file token is denied by GHCR; `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` before `mh up` so logout specs do not hang on a Tailscale IdP host.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `cypress/e2e/navigation.cy.ts` — 1.0.1 catalog (mentee vs admin vs least-privileged), Settings `http://localhost:8394/mentee/config`, Events `:8080/discovery/events`, removed Products/Customer/Members ids, admin-only Notifications/Settings, Token tab claims, `/mentee/config` role gate, logout `return_to=/discovery/`
- `cypress/e2e/deployment.cy.ts` — only if a prefix or `/admin` assertion must mention `/config`
- `cypress/e2e/journey.cy.ts`, `cypress/e2e/path.cy.ts`, `cypress/e2e/resource.cy.ts` — only if a 1.0.1 catalog or `/admin` vs `/config` selector breaks
- `cypress/support/commands.ts` / `cypress/support/e2e.ts` — only if visit helpers need a config-page path
- `cypress/fixtures/**` — only if Token/config intercepts need a fixture
- `README.md` — Testing / Automation Support 1.0.1 hamburger ids and Settings host

Do not restore a local drawer. Do not change the spa_utils pin. Do not add an Events route or list dashboards. Do not pass disallowed `PageFrame` props.

## Execution Notes

### Planned approach

Rewrite `cypress/e2e/navigation.cy.ts` from the 1.0.0 catalog to spa_utils 1.0.1, following the mentor SPA F157 Cypress pattern without adding an Events route or following Events/Home off this SPA.

- Keep prefix / API / title / drawer-close / unauthenticated-deep-link / runtime-config coverage.
- Mentee-only (`cy.login(['mentee'])`): ordered Home, Events; ALB `:8080` hrefs; no Notifications/Settings.
- Admin-only (`cy.login(['admin'])`): ordered Home, Events, Notifications, Settings; no mentor browse rows. Settings `href` asserted on `http://localhost:8394/mentee/config` (includes `:8394`, not `:8080`, not `/admin/settings`, not `/mentee/mentee`) **before** click; click stays on this SPA.
- Other least-privileged (`cy.login(['customer'])`): Home + Events only; removed Products/Customer/Members ids absent.
- Removed ids `nav-products-link`, `nav-customer-link`, `nav-customer-members-link` absent for admin, mentee, and customer.
- Token tab: intercept `GET **/mentee/api/config` with `token: { profile_id, customer_id, mentor_id }`; open Settings → `admin-tab-token`; assert the three display inputs.
- Config gate: mentee-only `cy.visit('/mentee/config')` (plain visit — guard `location.replace`s to `:8080/discovery/`); prove pathname is no longer `/mentee/config` and AdminPage chrome is absent via `cy.origin`. Admin `cy.visitPrefixed('/mentee/config')` after login stays. No local Home fallback.
- Logout: `return_to` is `http://localhost:8080/discovery/` (not `127.0.0.1`, not bare `/`, not `/mentee/`). Delete the F129/F132 “root origin” comment.
- README Testing / Automation Support: 1.0.1 ids, Settings host, removed Products/Customer/Members.
- Do not change spa_utils pin, router, or other repos. No `npm run lint` script. Rebuild container (`npm run container` + `npm run service`) before `cypress:run` so 8394 is the new image.

### Summary

Rewrote `cypress/e2e/navigation.cy.ts` for the spa_utils **1.0.1** hamburger catalog and updated README Testing / Automation Support. Settings is asserted on hosting `http://localhost:8394/mentee/config` (not `:8080`, not `/admin/settings`, not `/mentee/mentee`). Token tab claims are stubbed via `GET **/mentee/api/config`. Non-admin `/mentee/config` is proven to unload toward `:8080/discovery/` via `cy.origin` (no local Home fallback). Logout `return_to` is `http://localhost:8080/discovery/`. Packaged Cypress gate is green.

### Files changed

- `cypress/e2e/navigation.cy.ts` — 1.0.1 catalog (mentee / admin / customer), Settings hosting href + Token tab, `/mentee/config` role gate, logout `return_to=/discovery/`
- `README.md` — Testing / Automation Support 1.0.1 ids, Settings host, removed Products/Customer/Members, Token tab ids
- `tasks/PENDING.F135.config_catalog_e2e.md` — this Execution Notes section

No changes to `deployment.cy.ts`, detail specs, Cypress support, fixtures, spa_utils pin, or router.

### Command results

| Command | Result |
|---------|--------|
| `npm run test` | **pass** — 11 files, 51 tests |
| `npm run test:coverage` | tests **pass** (51/51); threshold **exit 1** is the pre-existing miss (composables branches 59.57%/60%, components 0%/90%). `vitest.config.ts` not changed. |
| `npm run build` | **pass** — `vue-tsc` + Vite |
| `npm run container` | **pass** — `ghcr.io/mentor-forge/mentorhub_mentee_spa:latest` |
| `npm run service` | **pass** — `mh down && mh up mentee` (welcome + mongodb + mentee_api + mentee_spa on 8394) |
| `npm run cypress:run` | **pass** — 5 specs, **39/39** tests |

Cypress spec counts:

- `deployment.cy.ts` — 8
- `journey.cy.ts` — 9
- `navigation.cy.ts` — 13
- `path.cy.ts` — 4
- `resource.cy.ts` — 5

### Env workarounds

- `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` exported before `npm run service` so logout specs do not hang on a Tailscale IdP host. Container `runtime-config.js` confirmed that URI.
- `GITHUB_TOKEN` was already set; GHCR auth was not needed (container build used CodeArtifact + cached Docker Hub bases).

### Follow-ups

- This repo has **no** `npm run lint` script. `npm run build` (`vue-tsc`) is the type gate. Do not add a lint script; record the gap from issue acceptance criteria.
- `npm run test:coverage` still exits 1 on pre-existing component/composable thresholds (same as F134).
