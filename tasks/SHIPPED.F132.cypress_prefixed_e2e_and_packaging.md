# F132 – Cypress e2e under `/mentee/` and full packaging verification

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F131_nginx_mentee_prefix_and_api_client`  
**Description**: Re-point every Cypress visit to the `/mentee/` prefix, replace the deleted local drawer coverage with the spa_utils `PageFrame` automation ids, and run the full packaged stack as the acceptance gate for both source issues (F-ES09 and F-ES10).

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — `data-automation-id` convention and Cypress selector rules
- `../mentorhub_spa_utils/README.md` — **Universal PageFrame (1.0.0)** automation ids and the role-gated catalog; **Cross-SPA URLs** (direct SPA debug ports are for Cypress and debugging only)
- `../mentorhub_spa_utils/cypress/support/registerAuthCommands.ts` — the `cy.login(roles?)` implementation: `visitPath` defaults to `'/'` and **roles default to `['admin']`** when none are passed
- `README.md` — Testing section
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `tasks/PENDING.F128.retire_list_pages_and_lock_routes.md` — locked route table and the specs deleted there
- `cypress.config.ts` — `baseUrl: 'http://localhost:8394'`, spa_utils JWT sign task, esbuild preprocessor
- `cypress/support/e2e.ts` — `registerAuthCommands({ visitPath: '/' })`
- `cypress/support/commands.ts` — currently an empty re-export
- `cypress/e2e/journey.cy.ts`, `cypress/e2e/path.cy.ts`, `cypress/e2e/resource.cy.ts` — the specs surviving F128, still visiting un-prefixed paths
- `nginx.conf.template`, `Dockerfile` — F131 prefix serving and runtime-config generation

**Ports:** `cypress.config.ts` `baseUrl` stays `http://localhost:8394` (the published container port). Visits become prefixed paths such as `/mentee/`, `/mentee/journey`, `/mentee/paths/path-1`, and `/mentee/resources/resource-1` — not `/` or `/journey`. Do not point Cypress at the welcome origin on `:8080`; single-SPA e2e runs against the direct port.

`npm run dev` and `npm run service` both bind host port **8394**. Cypress runs against `npm run service`, so no dev server may be running.

**Role defaults matter here.** `cy.login()` with no argument seeds an **admin** token, which makes the `PageFrame` hamburger show Products and Settings in addition to Home and Notifications. Use an explicit non-catalog role (for example `cy.login(['mentee'])`) for the assertion that a plain mentee sees only Home and Notifications, and `cy.login(['admin'])` for the role-gated rows. Do not assert "only two rows exist" against a default `cy.login()`.

## Goals

- `cypress/support/e2e.ts` passes `registerAuthCommands({ visitPath: '/mentee/' })` so `cy.login()` seeds `localStorage` on the prefixed origin and its first navigation lands in the app. Same-origin JWT storage must work when the app is opened under `/mentee/`.
- Every `cy.visit(...)` and every `cy.url().should('include', ...)` in `cypress/e2e/**` uses the `/mentee/` prefix, matching the F128 route table. The default-route spec visits `/mentee/` and asserts the URL includes `/mentee/journey`.
- `cypress/e2e/navigation.cy.ts` is recreated against spa_utils ids only: `nav-drawer-toggle`, `page-frame-title`, `nav-profile-link`, `nav-home-link`, `nav-notifications-link`, `nav-logout-link`. No SPA-local drawer selector (`nav-journey-link`, `nav-paths-link`, `nav-resources-link`, `nav-admin-link`, `app-bar-title`) survives anywhere in `cypress/`.
  - The drawer test asserts that `nav-home-link` and `nav-notifications-link` are absolute `:8080` hrefs (welcome / ALB origin) pointing at `/discovery/` and `/discovery/notifications` — real anchors, not Vue Router links — and that `nav-profile-link` targets `/customer/profile/`.
  - A `cy.login(['mentee'])` run shows Home and Notifications and **not** `nav-products-link` or `nav-settings-link`; a `cy.login(['admin'])` run shows those two as well.
  - `page-frame-title` shows `Mentee` before the journey resolves and `{full_name}:Mentee` once the stubbed journey loads.
  - The logout test asserts auth is cleared and the browser leaves for the IdP login URL. `PageFrame`'s built-in logout returns to the **root** origin rather than `/mentee/` (see the F129 note), so assert the IdP `pathname` and the presence of `return_to`, not a prefixed `return_to` value.
- Detail-page coverage is preserved, not thinned: the journey page (including expand, promote, advance, and complete-with-rating-and-note), `/mentee/paths/{id}` nested cards, and `/mentee/resources/{id}` typed editors and aggregation all keep their existing assertions with prefixed visits.
- The two Discovery browse links added in F128 are covered: `path-view-browse-paths-link` and `resource-view-browse-resources-link` have absolute `:8080` hrefs at `/discovery/paths` and `/discovery/resources`. Assert the `href` attribute — do not follow the link out of the app.
- No spec references a removed route (`/paths` or `/resources` as a list), a deleted list page's automation ids (`path-list-*`, `resource-list-*`), or a `getPaths` / `getResources` intercept.
- `README.md` Testing section documents the prefixed Cypress entry point and that `npm run service` must be running (not `npm run dev`).
- No production source behavior changes in this task. Touch `src/**` only if a spec exposes a missing or wrong `data-automation-id`, and keep any such change to the id attribute.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test`
- `npm run build` — `vue-tsc` is the type gate (this repo defines no `lint` script)

**Packaging verification (the acceptance gate for this wave):**

- `npm run container` — build the SPA container image
- `npm run service` — run db + API + SPA containers
- `npm run cypress:run` — headless end-to-end tests (long running); **all** specs must pass against `http://localhost:8394/mentee/...`
- `curl -i http://localhost:8394/mentee/` — still `200 text/html` with `/mentee/` asset URLs (regression check on F131)
- If Developer Edition welcome is up on `:8080`, confirm `http://localhost:8080/mentee/` serves this SPA, that login round-trips through `http://<host>:8080/login.html`, and that API calls from the prefixed origin reach `mentee_api`. Record it as an external check if welcome is not part of the running stack.

Acceptance criteria from the source issues that must hold at the end of this task: `:8080/mentee/` serves this SPA (not welcome's `index.html`), `:8394/mentee/` works for single-SPA Cypress, API calls from the prefixed origin reach `mentee_api` through this SPA's nginx, and the unit plus e2e suites pass. The issues also list `npm run lint`; this repo has no `lint` script — record that gap as a follow-up rather than adding tooling here.

## Outputs

Paths are relative to **this SPA repository root**.

**Create:**

- `cypress/e2e/navigation.cy.ts` — `PageFrame` app bar, drawer, profile link, and logout using spa_utils ids

**Update:**

- `cypress/support/e2e.ts` — `visitPath: '/mentee/'`
- `cypress/e2e/journey.cy.ts`, `cypress/e2e/path.cy.ts`, `cypress/e2e/resource.cy.ts` — prefixed visits and URL assertions, plus the Discovery browse-link href assertions
- `cypress/support/commands.ts` — only if `cy.login()` needs a prefixed-origin helper beyond `visitPath`
- `README.md` — Testing section

Do not change `cypress.config.ts` `baseUrl`, `vite.config.ts`, `nginx.conf.template`, `Dockerfile`, `package.json`, `vitest.config.ts`, or `src/api/client.ts` in this task.

## Execution Notes

### Plan
1. Point `registerAuthCommands` at `visitPath: '/mentee/'` so JWT seeding and first navigation land on the prefixed origin.
2. Recreate `cypress/e2e/navigation.cy.ts` against spa_utils `PageFrame` ids only (`nav-drawer-toggle`, `page-frame-title`, `nav-profile-link`, `nav-home-link`, `nav-notifications-link`, `nav-logout-link`, plus role-gated `nav-products-link` / `nav-settings-link`). No local drawer selectors. Mentee-only login for Home/Notifications; admin login for Products/Settings. Title: `Mentee` before delayed journey stub, then `{full_name}:Mentee`. Logout: IdP pathname + `return_to` presence (not a prefixed value). Home/Notifications/profile hrefs are absolute `:8080` anchors.
3. Prefix every `cy.visit` and `cy.url().should('include', …)` in journey/path/resource specs: `/mentee/`, `/mentee/journey`, `/mentee/paths/path-1`, `/mentee/resources/resource-1`. Keep existing detail-page assertions (expand, promote, advance, complete-with-rating-and-note, nested cards, typed editors, aggregation).
4. Assert Discovery browse-link `href`s (`path-view-browse-paths-link` → `/discovery/paths`, `resource-view-browse-resources-link` → `/discovery/resources`) without following them.
5. Document prefixed Cypress entry and `npm run service` (not `npm run dev`) in README Testing.
6. Packaging gate: `npm run test`, `npm run build`, `npm run container`, `npm run service`, `npm run cypress:run`, `curl -i http://localhost:8394/mentee/`. Env: `GITHUB_FOREVER_TOKEN` as `GITHUB_TOKEN`, `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html`. No production source changes unless a missing/wrong automation id is exposed.
7. Leave Status Pending. Record follow-ups: no `lint` script; spa_utils base-aware logout return URL; `:8080/mentee/` welcome check if welcome is up.

### Implementation
- `cypress/support/e2e.ts`: `visitPath: '/mentee/'`. `commands.ts` unchanged — `visitPath` is enough for prefixed JWT storage.
- `cypress/e2e/navigation.cy.ts` recreated (spa_utils ids only). `cy.login(['mentee'])` for Home/Notifications and **not** Products/Settings; `cy.login(['admin'])` for those two. Profile/Home/Notifications hrefs asserted as `http://localhost:8080/...` (not `:8394`, not `/mentee/mentee`). Title: delayed `GET **/api/journey` stub so `page-frame-title` is `Mentee` then `Jane Mentee:Mentee` (login visit is the only navigation so the delayed intercept is not raced by a second visit). Logout uses `cy.origin('http://127.0.0.1:8080')` and asserts pathname `/login.html` plus `return_to=` presence, not a prefixed return_to value. `PageFrame` logout still returns to origin `/`.
- Journey/path/resource specs: all visits and URL includes prefixed. Detail coverage kept. New browse-link `href` assertions; links are not followed.
- `README.md` Testing: Cypress entry is `http://localhost:8394/mentee/...`; `npm run service` required, not `npm run dev`. Automation Support notes `navigation.cy.ts` covers spa_utils chrome.
- No `src/**` changes. No edits to `cypress.config.ts` `baseUrl`, vite, nginx, Dockerfile, package.json, vitest, or `src/api/client.ts`.
- Grep `cypress/`: no `nav-journey-link`, `app-bar-title`, `nav-admin-link`, list-page ids, `getPaths`/`getResources`, or unprefixed `/paths` / `/resources` list visits.

### Commands run and results
Env: `GITHUB_TOKEN` from `~/.mentorhub/GITHUB_FOREVER_TOKEN`; `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html`. Port 8394 was Docker from F131; `mh down` in `npm run service` freed it. No `npm run dev` alongside service.

| Command | Result |
|---|---|
| `npm run test` | **pass** — 10 files, 47 tests |
| `npm run build` | **pass** — `vue-tsc` clean, Vite production build |
| `npm run container` | **pass** — `ghcr.io/mentor-forge/mentorhub_mentee_spa:latest` |
| `npm run service` | **pass** — welcome, mongo, mongodb_api/spa, mentee_api, mentee_spa up. SPA `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` |
| `npm run cypress:run` | **pass** — 22/22 (journey 9, navigation 4, path 4, resource 5), ~15s |
| `curl -i http://localhost:8394/mentee/` | **200** `text/html`, `/mentee/` asset URLs (`/mentee/runtime-config.js`, `/mentee/assets/...`) |
| `curl -i http://localhost:8080/mentee/` | **200** this SPA (not welcome `index.html`); same `/mentee/` assets |

`npm run lint` is **not defined** in this repo; `npm run build` (`vue-tsc`) is the type gate.

Source-issue acceptance: `:8080/mentee/` serves this SPA; `:8394/mentee/` works for Cypress; API calls from the prefixed origin use `/mentee/api` through this SPA's nginx (F131); unit + e2e pass.

### Follow-ups
- This repo has no `lint` script; the source issues list `npm run lint`. Do not add tooling here.
- spa_utils: `PageFrame` logout `return_to` is origin `/`, not `/mentee/` (F129). Cypress asserts pathname + `return_to` presence only.
- Cypress logout assumes loopback IdP. With `HOST_NAME` set, `mh` injects a Tailscale `IDP_LOGIN_URI` and the logout spec hangs. For Cypress, set `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` before `mh up`.
- Status left **Pending** for the orchestrator to commit, push, and mark Shipped.

