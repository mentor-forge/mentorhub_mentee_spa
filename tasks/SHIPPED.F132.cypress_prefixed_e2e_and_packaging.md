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

1. Read this task, `tasks/_ORCHESTRATE.md` ("Task execution workflow"), `tasks/_PLANNING.md`, `tasks/SHIPPED.F131...` (its "Cypress is not a gate here" warning), `tasks/SHIPPED.F129...` (drawer observations and the logout limitation), `tasks/SHIPPED.F128...` (locked route table), `ArchitecturePrinciples.md`, `spa_standards.md`, the spa_utils README "Universal PageFrame (1.0.0)" section, and the spa_utils sources that own the ids (`PageFrame.vue`, `universalNav.ts`, `journeyUrls.ts`, `idpRedirect.ts`, `useAuth.ts`, `registerAuthCommands.ts`) plus the spa_utils demo `navigation.cy.ts` as a reference shape.
2. `cypress/support/e2e.ts` → `visitPath: '/mentee/'`.
3. Re-point every visit and every API intercept in the three surviving specs, preserving all existing assertions; add the two Discovery browse-link `href` tests F128 flagged.
4. Create `cypress/e2e/navigation.cy.ts` against spa_utils ids only, with explicit roles.
5. **Prove the prefix is exercised, not merely present**: write a throwaway negative-control spec whose assertions are the *inverse* of the real ones and confirm each one fails. Add whatever guard the negative control shows is missing.
6. Gates: `npm run test`, `npm run build`, `npm run cypress:run` against the already-running `npm run service` stack, the `curl` regression check, and the `:8080` welcome-origin check. Delete every temporary artifact.

### Commands run

```sh
npm run test                                            # 52/52 (baseline, and again at the end)
npm run build                                           # vue-tsc clean
npm run cypress:run                                     # 28/28 across 4 specs
npx cypress run --spec cypress/e2e/tmp-f132-negative.cy.ts     # TEMPORARY negative control, deleted
npx cypress run --spec cypress/e2e/tmp-f132-welcome.cy.ts \
  --config baseUrl=http://localhost:8080                       # TEMPORARY welcome-origin check, deleted
rg -n "nav-journey-link|nav-paths-link|nav-resources-link|nav-admin-link|app-bar-title" cypress/
rg -n "path-list-|resource-list-" cypress/
rg -n "getPaths|getResources|useOffsetList|ListParams|back-to-list" cypress/
rg -n "'/paths'|\"/paths\"|'/resources'|\"/resources\"" cypress/
rg -n "cy\.visit\(|intercept\(" cypress/
curl -s -i http://localhost:8394/mentee/                # 200 text/html no-store, /mentee/ assets
curl -s -i http://localhost:8080/mentee/{,api/config,runtime-config.js,journey,assets/index-*.js}
curl -H "Authorization: Bearer <dev JWT>" http://localhost:8080/mentee/api/{config,journey}   # 200 JSON
```

`npm run container` was **not** needed: no `src/**` file was touched, and the built asset hash
(`index-B2_mCQ8l.js`) still matches the image the running container serves.

### The trap F131 warned about is worse than "falls back to the raw pathname"

The negative control found the precise mechanism, and it defeats the obvious assertion. Vue Router's
`normalizeBase` strips the trailing slash from the base (`/mentee/` → `/mentee`), `stripBase` leaves an
un-prefixed pathname untouched, and the bootstrap `history.replaceState` then **rewrites the address bar**
to `createBaseLocation() + '/mentee' + '/journey'`. So after `cy.visit('/journey')`:

| Assertion | Un-prefixed visit | Verdict |
|---|---|---|
| `cy.url().should('include', '/journey')` | passes | useless |
| `cy.location('pathname').should('eq', '/mentee/journey')` | **passes** — the URL was rewritten | useless on its own |
| `PerformanceNavigationTiming.name` pathname | `/journey` | **discriminates** |

`PerformanceNavigationTiming.name` records the URL the document was actually fetched from and is not
touched by `replaceState`. That is the honest check, so it went into a `cy.visitPrefixed(path)` command in
`cypress/support/commands.ts` (the task's conditional output — a prefixed-origin helper beyond `visitPath`).
It rejects any path not matching `/^\/mentee\//` up front and then asserts the fetched document URL. Every
visit in `journey.cy.ts`, `path.cy.ts`, and `resource.cy.ts` goes through it. `cypress/support/e2e.ts` now
imports `./commands` (it previously did not, despite the file's own comment).

### Negative control — every real assertion confirmed to fail when the prefix is wrong

`cypress/e2e/tmp-f132-negative.cy.ts` (temporary, deleted) inverted each assertion. **2 passing traps,
6 failing controls**, exactly as designed:

| Control | Assertion | Result |
|---|---|---|
| trap A | un-prefixed visit renders and `cy.url().include('/journey')` passes | **passed** — documents why the weak form is not evidence |
| trap B | un-prefixed visit also satisfies `cy.location('pathname') === '/mentee/journey'` | **passed** — the `replaceState` rewrite |
| B2 | fetched document URL is `/mentee/journey` after `cy.visit('/journey')` | **failed**: `expected '/journey' to equal '/mentee/journey'` |
| C | the client's journey request path is `/api/journey` | **failed**: `expected '/mentee/api/journey' to equal '/api/journey'` |
| D | shell scripts are served from `/assets/` and `/runtime-config.js` | **failed**: `expected false to equal true` |
| E | `cy.visitPrefixed('/paths/path-1')` is accepted | **failed**: `Cypress visits must carry the /mentee/ prefix` |
| F | the router's IdP `return_to` pathname is `/paths/path-1` | **failed**: `expected '/mentee/paths/path-1' to equal '/paths/path-1'` |
| G | a `cy.login(['mentee'])` drawer shows `nav-products-link` | **failed**: never found — the role gate is real, so the exact-catalog assertions are not vacuous |

So the prefix is genuinely exercised at four independent layers: the **document URL** (B2/E), the **API base**
(C), the **served shell and asset URLs** (D), and the **router's IdP return URL** (F).

### Test results

**`npm run test`** — **PASS**, unchanged: 10 test files, **52 passed, 0 failed**. No unit test was touched.

**`npm run build`** — **PASS**: `vue-tsc` clean, `vite build` 651 modules, only the pre-existing >500 kB
chunk advisory. Asset hashes identical to F131 (`index-B2_mCQ8l.js`, `index-DPA2ijAz.css`), confirming no
`src/**` behavior change.

**`npm run cypress:run`** — **PASS: 28 of 28 across 4 specs**, all against `http://localhost:8394/mentee/...`.

| Spec | Tests | Passing | Was (F131) |
|---|---|---|---|
| `journey.cy.ts` | 9 | 9 | 9 |
| `navigation.cy.ts` | 10 | 10 | (deleted in F128) |
| `path.cy.ts` | 4 | 4 | 3 |
| `resource.cy.ts` | 5 | 5 | 4 |
| **Total** | **28** | **28** | 16 |

Detail-page coverage was **preserved, not thinned**. Every pre-existing `it` survives with its assertions
intact; the three additions are the two Discovery browse-link `href` tests F128 asked for and the exact
`pathname` assertion on the default-route test.

### `navigation.cy.ts` — what the drawer actually shows

Ordered catalog rows read from the DOM (the drawer's first `v-list`, above the divider), asserted as an exact
list so absent rows are covered without naming them — the spa_utils catalog ids for `mentor` and `customer`
roles are on this task's forbidden-selector list:

| Login | Catalog rows (in order) | hrefs |
|---|---|---|
| `cy.login(['mentee'])` | `nav-home-link`, `nav-notifications-link` | `:8080/discovery/`, `:8080/discovery/notifications` |
| `cy.login(['admin'])` | `nav-home-link`, `nav-products-link`, `nav-notifications-link`, `nav-settings-link` | adds `:8080/discovery/products`, `:8080/admin/settings` |

Every row is a real `<a>` (asserted with `should('match', 'a')`) carrying an absolute welcome / ALB href on
port **8080** — never the `8394` debug port and never a Vue Router `to`. `nav-profile-link` targets
`:8080/customer/profile/`. `nav-logout-link` has no href (click handler) and is in the second list.
`page-frame-title` reads exactly `Mentee` while the journey response is delayed 3 s and exactly
`Jane Mentee:Mentee` after it resolves.

**Logout / IdP.** The container's `IDP_LOGIN_URI` is the cross-origin Tailscale MagicDNS host
`http://m5max.tailb0d293.ts.net:8080/login.html`, so the spec intercepts `**/mentee/runtime-config.js` — the
highest-priority source in the spa_utils resolution order, and the only one that works here because the real
`runtime-config.js` uses `Object.assign(window.__MENTORHUB_RUNTIME__ || {}, …)` and therefore overwrites
anything seeded in `onBeforeLoad`. The stub points at a same-origin `/login.html`, which is itself intercepted
so nginx's history fallback cannot boot the SPA again. Per the task the assertion is the IdP **`pathname`**
(`/login.html`) plus the **presence** of `return_to`, not a prefixed `return_to` value — `PageFrame` returns to
the root origin (the recorded F129/F130 spa_utils limitation). `access_token` and `user_roles` are asserted
cleared. A separate test asserts the **real** container value without navigating cross-origin:
`cy.request('/mentee/runtime-config.js')` is `200`, `no-store`, and its `IDP_LOGIN_URI` has pathname
`/login.html` on port `8080`.

The router's own guard *is* base-aware, and that is asserted: an unauthenticated `cy.visit('/mentee/paths/path-1')`
leaves for the IdP with `return_to` whose pathname is exactly `/mentee/paths/path-1`.

### Grep verification — nothing forbidden survives in `cypress/`

All four greps return **no matches** (`rg` exit 1):

| Grep over `cypress/` | Result |
|---|---|
| `nav-journey-link\|nav-paths-link\|nav-resources-link\|nav-admin-link\|app-bar-title` | no matches |
| `path-list-\|resource-list-` | no matches |
| `getPaths\|getResources\|useOffsetList\|ListParams\|back-to-list` | no matches |
| `'/paths'\|"/paths"\|'/resources'\|"/resources"` (list routes) | no matches |

Every `cy.visit(` in `cypress/e2e/**` is `cy.visitPrefixed(<prefixed const>)` except one deliberate plain
`cy.visit('/mentee/paths/path-1')` in the unauthenticated-deep-link test (the page leaves for the IdP during
bootstrap, so the navigation-entry check would read the IdP stub). Every API intercept is `**/mentee/api/...`
except one deliberately broad `**/api/journey` in `navigation.cy.ts`, which exists to *assert* that the
observed request URL is `/mentee/api/journey`.

Note the surviving spa_utils catalog ids `nav-resources-link` / `nav-paths-link` still appear in `README.md`'s
Automation Support table (documentation of the shared catalog, not a selector in `cypress/`); the forbidden
list is scoped to `cypress/`.

### Packaging verification — `curl -i`

`http://localhost:8394/mentee/` → **200**, `Content-Type: text/html`, `Cache-Control: no-store`,
`<title>Mentee</title>`, and asset URLs `/mentee/runtime-config.js`, `/mentee/assets/index-B2_mCQ8l.js`,
`/mentee/assets/index-DPA2ijAz.css`. F131 spot-checks all still green: `/` → **302** `Location: /mentee/`,
`/health` → **200** `text/plain`, `/api/config` and `/mentee/api/config` → **401** `application/json`,
`/runtime-config.js` and `/mentee/runtime-config.js` → **200** `application/javascript`.

### Welcome origin on `:8080` — verified, not deferred

Developer Edition welcome was part of the running stack.

| Check | Result |
|---|---|
| `:8080/mentee/` | **200**, byte-identical shell to `:8394/mentee/` (same `ETag "6a91d981-21b"`, `no-store`), `/mentee/` asset URLs — **this SPA, not welcome's `index.html`** |
| `:8080/` | **200** `<title>Mentor Hub - Welcome</title>` — the two are distinct |
| `:8080/mentee/journey` | **200** `text/html` — history fallback works through welcome |
| `:8080/mentee/assets/index-B2_mCQ8l.js` | **200**, `727766` bytes |
| `:8080/mentee/runtime-config.js` | **200** `no-store`, real Tailscale `IDP_LOGIN_URI` |
| `:8080/mentee/api/config` unauthenticated | **401** `application/json` from `mentee_api` |
| `:8080/mentee/api/config` **with a dev JWT** | **200** `application/json` — real `config_items` payload |
| `:8080/mentee/api/journey` **with a dev JWT** | **200** `application/json` — real journey document |
| `IDP_LOGIN_URI` fetched directly | **200** `text/html` login page |

The authenticated `200`s matter: a `401` only proves the location exists, whereas a real payload proves the
prefixed browser origin reaches `mentee_api` through this SPA's nginx end to end.

**Login round-trip, actually executed.** A temporary spec run with `--config baseUrl=http://localhost:8080`
(deleted afterwards; `cypress.config.ts` untouched) drove the whole loop and passed 2/2: unauthenticated
`:8080/mentee/journey` → cross-origin `http://m5max.tailb0d293.ts.net:8080/login.html` with
`return_to=http%3A%2F%2Flocalhost%3A8080%2Fmentee%2Fjourney` → select the `daniel` mentee persona → submit →
back at `:8080/mentee/journey` with `nav-drawer-toggle` visible and an `access_token` in `localStorage`.
`welcome-auth.js` allows `http://localhost:*` return targets and redirects to `${returnTo}#access_token=…`,
which `src/initAuth.ts`'s `bootstrapAuthFromUrl()` consumes. No other repository was touched.

### Files changed

**Created (1):**

- `cypress/e2e/navigation.cy.ts` — 10 tests over the `PageFrame` shell using spa_utils ids only.

**Updated (5):**

- `cypress/support/e2e.ts` — `visitPath: '/mentee/'`, plus `import './commands'`.
- `cypress/support/commands.ts` — the `cy.visitPrefixed(path)` command (the task's conditional output).
- `cypress/e2e/journey.cy.ts` — prefixed visits via `cy.visitPrefixed`, prefixed API intercepts, exact
  `pathname` assertion on the default-route test. All 9 `it` blocks and their assertions preserved.
- `cypress/e2e/path.cy.ts` — prefixed visits and intercepts, plus a new `path-view-browse-paths-link`
  href test (`:8080/discovery/paths`, attribute only, link not followed).
- `cypress/e2e/resource.cy.ts` — prefixed visits and intercepts, plus a new
  `resource-view-browse-resources-link` href test (`:8080/discovery/resources`).
- `README.md` — Testing section: `npm run service` (not `npm run dev`), the `8394` baseUrl, prefixed visits,
  the exact-`pathname` rule and why, explicit roles, and a per-spec coverage table.

**`src/**` NOT touched.** No spec exposed a missing or wrong `data-automation-id`; all ids the new spec needs
already exist (spa_utils for the chrome, F128 for the two browse links). No container rebuild was required.

No changes to `cypress.config.ts`, `vite.config.ts`, `nginx.conf.template`, `Dockerfile`, `package.json`,
`package-lock.json`, `vitest.config.ts`, `src/api/client.ts`, or anything else under `src/`.

**Temporary artifacts — all removed.** `cypress/e2e/tmp-f132-negative.cy.ts`,
`cypress/e2e/tmp-f132-welcome.cy.ts`, a throwaway JWT-signing script, and the `cypress/screenshots` /
`cypress/videos` directories were deleted. `find cypress -type f` lists exactly the four specs and the two
support files; `git status` lists exactly the six files above plus this task file.

### Environment left as

Full stack from `npm run service` still up: `mentorhub-mongodb-1`, `mentorhub-mongodb_api-1`,
`mentorhub-mongodb_spa-1`, `mentorhub-mentee_api-1`, `mentorhub-mentee_spa-1`, `mentorhub-welcome-1`. Host
**8394** is bound by the `mentee_spa` container only — no dev server was started. The image is unchanged from
F131. Nothing committed, nothing pushed, no branch created.

### Wave acceptance criteria — all hold

1. `:8080/mentee/` serves this SPA, not welcome's `index.html` — verified (identical `ETag` to the container,
   `<title>Mentee</title>`, `/mentee/` asset URLs; `:8080/` still returns the welcome page).
2. `:8394/mentee/` works for single-SPA Cypress — 28/28 green there.
3. API calls from the prefixed origin reach `mentee_api` through this SPA's nginx — authenticated `200`s with
   real payloads at `:8080/mentee/api/config` and `:8080/mentee/api/journey`, and Cypress asserts the browser
   sends `/mentee/api/journey`.
4. Unit and e2e suites pass — `npm run test` 52/52, `npm run cypress:run` 28/28.

### Follow-ups

1. **`npm run lint` still does not exist** (carried from F127–F131). Both source issues list it. `npm run build`
   (`vue-tsc`) remains the type gate. Recorded here as the task instructs rather than adding tooling.
2. **`npm run test:coverage` still fails, pre-existing and structural** — `src/components/**` at 0% (no
   component tests) and `src/composables/**` branches ~59.6% vs the 60% threshold. Untouched by this task;
   `npm run test` is the gate. Worth its own task.
3. **spa_utils: logout `return_to` is still base-unaware.** `PageFrame.handleLogout()` sends
   `return_to=${origin}/`, so a logged-out mentee lands on the welcome root instead of `/mentee/`. Asserted
   here only as "an IdP pathname plus some `return_to`", which is the weakest form of that test; once
   spa_utils honors the Vite base, tighten `navigation.cy.ts` to assert `return_to` ends in `/mentee/`.
4. **spa_utils: consider publishing `visitPrefixed` (or a `basePath` option on `registerAuthCommands`).**
   Every journey SPA moving to a path prefix will hit the same `replaceState` trap, where an un-prefixed visit
   silently looks correct. The command is 15 lines and repo-agnostic — a good harvest candidate.
5. **Surprise worth remembering: a green Cypress run really is not evidence of the prefix.** F131 predicted
   this; the mechanism turned out to be the router rewriting the address bar rather than merely tolerating the
   un-prefixed path, which also defeats `cy.location()`. Any future prefix work should keep the
   `PerformanceNavigationTiming` guard rather than trusting URL assertions.
6. **`/mentee/admin` has no e2e coverage.** It is direct-URL-only and `admin`-gated (F129); the role-gate
   redirect is still covered indirectly by the non-admin detail-page tests. Not added here because the task's
   navigation goals are scoped to the `PageFrame` ids.
