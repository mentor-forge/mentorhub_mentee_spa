# F132 – Cypress e2e under `/mentee/` and full packaging verification

**Status**: Pending  
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

_Reserved for the task execution agent: plan, commands run, test results, follow-ups._
