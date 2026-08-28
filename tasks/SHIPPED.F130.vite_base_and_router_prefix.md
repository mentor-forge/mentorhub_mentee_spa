# F130 – Vite `base` `/mentee/`, router `BASE_URL`, and base-aware runtime config

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F129_adopt_page_frame`  
**Description**: Mount the app at Vite `base: '/mentee/'` with `createWebHistory(import.meta.env.BASE_URL)` so browser URLs are `/mentee/...` and never `/mentee/mentee/...`. Make the existing runtime-config injection base-aware, add a base-aware IdP return URL, and add a prefixed dev proxy. Route `path` strings stay unchanged. Do not change `nginx.conf.template`, the `Dockerfile`, or `src/api/client.ts` — that is F131.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — container runtime config: load the generated `runtime-config.js` from `index.html` **before** the app bundle via a Vite `transformIndexHtml` plugin
- `../mentorhub_spa_utils/README.md` — IdP login URL resolution order (`window.__MENTORHUB_RUNTIME__.IDP_LOGIN_URI` → `VITE_IDP_LOGIN_URI` → Developer Edition fallback); **Cross-SPA URLs** (welcome / ALB origin on `:8080`; direct SPA debug ports such as **8394** are for Cypress, OpenAPI, and debugging only)
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `tasks/PENDING.F128.retire_list_pages_and_lock_routes.md` — locked route table with the resulting `/mentee/...` browser URLs
- `vite.config.ts` — today: **no `base`**; an `injectRuntimeConfig()` `transformIndexHtml` plugin (order `pre`) that hardcodes `<script src="/runtime-config.js">`; `server.port` 8394; `server.proxy` `/api` → `http://localhost:8393`
- `src/router/index.ts` — after F128/F129: `createWebHistory()`, `/` → `/journey`, `/journey`, `/resources/:id`, `/paths/:id`, `/admin`
- `index.html` — `<title>Mentor Hub Login</title>`, `<link rel="icon" type="image/svg+xml" href="/vite.svg" />`, `<script type="module" src="/src/main.ts">`
- `public/runtime-config.js` — committed dev-server placeholder that seeds `window.__MENTORHUB_RUNTIME__`
- `public/runtime-config.js.template` — `envsubst` source assigning `IDP_LOGIN_URI`
- `.env.development` — already sets `VITE_IDP_LOGIN_URI=http://127.0.0.1:8080/login.html`
- `vitest.config.ts` — already sets `VITE_IDP_LOGIN_URI` for unit tests

**Source issue**: F-ES09. Developer Edition welcome nginx (mentorhub L022) already ships `location /mentee/` forwarding the **full** URI to `http://mentee_spa:80` with `X-Forwarded-Prefix: /mentee` and **no prefix stripping**, plus `location = /mentee` redirecting to `/mentee/`; the cloud ALB forwards the full URI too. Do **not** rely on a welcome `rewrite` hack, and do not change welcome nginx, the cloud ALB, CloudFormation, or the Mentee API. Direct port **8394** stays published.

**Already in place — do not rebuild it:** unlike the sibling Customer SPA, this repo already has the runtime-config plumbing (the Vite inject plugin, both `public/runtime-config.js*` files, `.env.development`, the nginx `location = /runtime-config.js`, and the Dockerfile `IDP_LOGIN_URI` default plus startup `envsubst`). This task only makes the **injection** base-aware; F131 adds the prefixed nginx location.

**Prefix, not route paths:** with `base: '/mentee/'`, Vue route `path` strings stay `/`, `/journey`, `/resources/:id`, `/paths/:id`, `/admin`, and the browser shows `/mentee/journey`, `/mentee/resources/{id}`, … Duplicating the prefix inside route `path` strings would produce `/mentee/mentee/...` — do not do it.

Vite `base` changes asset **URLs** only; the build output stays in the `dist` root. Nothing in this task creates a `dist/mentee/` folder.

`IDP_LOGIN_URI` remains `http://<HOST_NAME>:8080/login.html`.

## Goals

- `vite.config.ts` sets `base: '/mentee/'`. There is exactly one base and one build — no second root-only build or profile.
- `src/router/index.ts` uses `createWebHistory(import.meta.env.BASE_URL)` and keeps every route `path` exactly as F128 left it, including the `/` → `/journey` redirect.
- `injectRuntimeConfig()` no longer hardcodes `/runtime-config.js`. Read the resolved base from the plugin's config hook (or `transformIndexHtml`'s context) and emit `<script src="${base}runtime-config.js">`, still ordered `pre` and still before the module bundle. The seeded `window.__MENTORHUB_RUNTIME__` line stays.
- The unauthenticated guard builds a base-aware IdP return URL so a deep link returns to the prefixed page: origin + `import.meta.env.BASE_URL` + the route path without its leading slash (`/paths/abc` → `http://<host>:8394/mentee/paths/abc`). It must never produce `/mentee/mentee/...` and never drop the prefix. Keep `next(false)` after the redirect.
- `index.html` `<title>` becomes `Mentee` instead of `Mentor Hub Login`. The `href="/vite.svg"` favicon link points at a file that does **not** exist in `public/` and already 404s — either delete the dead link or make it base-aware; do not leave a root-absolute `/vite.svg` reference behind. Record which you chose.
- `server.proxy` gains `'/mentee/api'` → `http://localhost:8393` with a rewrite that strips `/mentee` so the API still sees `/api/...`, and keeps the existing `/api` proxy for direct-port debugging.
- `README.md` documents that `npm run dev` serves the app at `http://localhost:8394/mentee/`, lists the in-app URLs from the F128 route table, and warns that `npm run dev` and `npm run service` both bind host port **8394** and cannot run at once.
- Do not change `nginx.conf.template`, `Dockerfile`, `package.json`, `cypress.config.ts`, or `src/api/client.ts` — the API client stays on `/api` until F131.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test` — update any unit test that asserts an un-prefixed IdP return URL
- `npm run build` — `vue-tsc` is the type gate (this repo defines no `lint` script). Then inspect `dist/index.html`: the module bundle, CSS, and `runtime-config.js` URLs all start with `/mentee/`, and there is no `/mentee/mentee` anywhere in the generated HTML. Confirm the build output is still the `dist` root (no `dist/mentee/` folder) and that `runtime-config.js` plus `runtime-config.js.template` were copied there from `public/`.
- `npm run api` then `npm run dev` — manual check:
  - `http://localhost:8394/mentee/` redirects to `/mentee/journey` and renders the journey detail page
  - `http://localhost:8394/mentee/paths/{id}` and `http://localhost:8394/mentee/resources/{id}` render their detail pages
  - a deep link opened while logged out returns to the same prefixed URL after the IdP round trip
  - the browser network tab shows `runtime-config.js` requested from `/mentee/runtime-config.js`
  - API calls succeed through the dev proxy

**Packaging verification** is **F131**: container nginx still serves only `/`, so `npm run container` / `npm run service` cannot serve the prefix yet, and `npm run cypress:run` (baseUrl `http://localhost:8394`) is expected to fail until F131 ships nginx and F132 re-points the specs. Do **not** run Cypress as a gate in this task; state that explicitly in Execution Notes.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `vite.config.ts` — `base: '/mentee/'`, base-aware `injectRuntimeConfig`, `/mentee/api` dev proxy
- `src/router/index.ts` — `createWebHistory(import.meta.env.BASE_URL)` and base-aware IdP return URL
- `index.html` — page title and the dead favicon link
- `README.md` — prefixed dev URL, route list, port-8394 conflict note

Do not change `nginx.conf.template`, `Dockerfile`, `package.json`, `cypress.config.ts`, `vitest.config.ts`, `public/runtime-config.js`, `public/runtime-config.js.template`, `.env.development`, `src/App.vue`, or `src/api/client.ts` in this task.

## Execution Notes

### Plan

1. Read this task, `tasks/_ORCHESTRATE.md` ("Task execution workflow"), `tasks/_PLANNING.md`, `tasks/SHIPPED.F129...` (including its "Notes for F130"), `tasks/SHIPPED.F128...` (locked route table), `ArchitecturePrinciples.md`, `spa_standards.md` (container runtime config loaded before the app bundle), the spa_utils README (IdP login URL resolution order, Cross-SPA URLs), and the current `vite.config.ts` / `src/router/index.ts` / `index.html` / `README.md`.
2. Before writing the plugin, verify in the **installed** Vite (7.3.6) how `index.html` URLs are rewritten, because a `pre` `transformIndexHtml` hook runs *before* Vite's own HTML URL handling in both dev and build. This decides whether emitting `${base}runtime-config.js` is safe.
3. `vite.config.ts`: add `base: '/mentee/'`; make `injectRuntimeConfig()` read the resolved base from `configResolved` and emit `<script src="${base}runtime-config.js">` (still `order: 'pre'`, still before the module bundle, seeded `window.__MENTORHUB_RUNTIME__` line kept); add a `/mentee/api` dev proxy that rewrites away the `/mentee` prefix, keeping the existing `/api` proxy for direct-port debugging.
4. `src/router/index.ts`: `createWebHistory(import.meta.env.BASE_URL)`; add a small helper that builds `origin + BASE_URL + fullPath-without-leading-slash` for the unauthenticated guard's IdP return URL. Every route `path` string stays exactly as F128 left it; `next(false)` stays.
5. `index.html`: `<title>Mentee</title>`; remove the dead `/vite.svg` favicon link.
6. `README.md`: prefixed dev URL, the F128 in-app URL list, and the port-8394 conflict warning.
7. Verify: `npm run test`; `npm run build` plus a `dist/index.html` inspection (prefixed bundle/CSS/runtime-config URLs, no `/mentee/mentee`, no `dist/mentee/`, both `runtime-config.js*` copied); then `npm run api` + a backgrounded `npm run dev` for the prefixed dev-server checks. Cypress and packaging are **not** gates in this task.

### Commands run

```sh
rg -n 'vite-ignore' node_modules/vite/dist/node/chunks/config.js   # dev + build handling, see below
npm run test                                                       # 47/47
npm run build                                                      # vue-tsc clean
ls -la dist/ && rg -n 'mentee/mentee' dist/                        # no matches
npm run api                                                        # mh down && mh up mentee-api (frees host 8394)
npm run dev                                                        # backgrounded, killed after verification
curl -s      'http://[::1]:8394/mentee/'
curl -s      'http://[::1]:8394/mentee/paths/abc'
curl -s -i   'http://[::1]:8394/'                                  # 302 → /mentee/
curl -s -i   'http://[::1]:8394/mentee/runtime-config.js'          # 200 text/javascript
curl -s -o /dev/null -w '%{http_code}' 'http://[::1]:8394/runtime-config.js'   # 404
curl -s -i   'http://[::1]:8394/mentee/api/config'                 # 401 unauthenticated — reaches the API
curl -s -i   'http://[::1]:8394/api/config'                        # 401 unauthenticated — reaches the API
npx cypress run --spec cypress/e2e/tmp-f130-verify.cy.ts           # temporary, 5/5, deleted after the run
```

### Results

**`npm run test`** — **PASS**: 10 test files, **47 tests passed, 0 failed** — identical to the F128/F129 baseline. **No unit test needed updating**: this repo has no `src/router` test file, and the only other `redirectToIdpLogin` assertion (`src/api/client.test.ts`, the `401` path) calls it with no argument, so nothing asserts an un-prefixed IdP return URL. No `src/**` test file was touched.

**`npm run build`** — **PASS**: `vue-tsc` clean, `vite build` succeeded, 651 modules transformed (same as F128/F129). Only the pre-existing >500 kB chunk advisory.

**`dist/index.html` inspection** — every generated URL carries exactly one `/mentee/` prefix:

```html
<script>window.__MENTORHUB_RUNTIME__=window.__MENTORHUB_RUNTIME__||{};</script>
<script src="/mentee/runtime-config.js" ></script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mentee</title>
<script type="module" crossorigin src="/mentee/assets/index-CP4y7ya7.js"></script>
<link rel="stylesheet" crossorigin href="/mentee/assets/index-DPA2ijAz.css">
```

`rg 'mentee/mentee' dist/` returns **no matches**. The runtime-config script still precedes the module bundle, and the seeded `window.__MENTORHUB_RUNTIME__` line is still first. Output layout is unchanged by `base` — `dist/` contains exactly `assets/`, `index.html`, `runtime-config.js`, `runtime-config.js.template`, and there is **no `dist/mentee/` folder**. Both `runtime-config.js` and `runtime-config.js.template` were copied from `public/` to the `dist` **root**.

### `vite-ignore` in dev: verified honored (this was the open risk)

Vite **7.3.6** as installed handles the attribute identically in dev and build, and the dev path is the one that would have double-prefixed:

| Site in `node_modules/vite/dist/node/chunks/config.js` | Behavior |
|---|---|
| `processNodeUrl` (l. 24739-24761) | `if (url[0] === '/' && url[1] !== '/') url = path.posix.join(config.base, url)` — this is what would turn `/mentee/runtime-config.js` into `/mentee/mentee/runtime-config.js` |
| `getScriptInfo` (l. 23858-23882) | sets `isIgnored = true` for a `vite-ignore` attribute on a `<script>` |
| `devHtmlHook` (l. 24806-24807) | `if (isIgnored) removeViteIgnoreAttr(...)` **`else if (src)`** `processNodeUrl(...)` — the ignore branch short-circuits URL rewriting entirely in **dev** |
| build HTML plugin (l. 23985-23986) | the same `isIgnored` / `removeViteIgnoreAttr` pair |
| `DEFAULT_HTML_ASSET_SOURCES` (l. 23280-23309) | has no `script` entry, so the `getNodeAssetAttributes` pass never touches this tag — the attribute is removed exactly once |

Live dev-server evidence (`curl 'http://[::1]:8394/mentee/'`), for both `/mentee/` and the history-fallback deep link `/mentee/paths/abc`:

```html
<script type="module" src="/mentee/@vite/client"></script>
<script>window.__MENTORHUB_RUNTIME__=window.__MENTORHUB_RUNTIME__||{};</script>
<script src="/mentee/runtime-config.js" ></script>
```

Single prefix, and `curl 'http://[::1]:8394/mentee/runtime-config.js'` returns **200 `text/javascript`** with the `public/runtime-config.js` body. `/runtime-config.js` (un-prefixed) is **404**, confirming the base-aware injection is what makes it reachable.

**Trap worth recording:** `/mentee/mentee/runtime-config.js` answers **200 `text/html`** on the dev server — Vite's SPA history fallback, not the script. Had the double-prefix bug shipped, dev would have silently loaded `index.html` as a script instead of failing loudly; only the container would have broken. That is why this was verified against the served bytes rather than assumed.

**Cosmetic artifact accepted.** Removing the attribute leaves one space: `<script src="/mentee/runtime-config.js" ></script>` in both dev and build output. Every alternative was worse: emitting an un-prefixed `/runtime-config.js` and letting `processNodeUrl` rebase it is what the task's Goals explicitly replace; a bare-relative `runtime-config.js` resolves against the document path in the built output (`/mentee/paths/runtime-config.js` on a deep link); moving the hook to `order: 'post'` would dodge `devHtmlHook` but the task requires `order: 'pre'`. The space is inert HTML.

Final `injectRuntimeConfig` (unchanged from what was already in the tree):

```typescript
const BASE = '/mentee/'

function injectRuntimeConfig(): Plugin {
  let base = BASE

  return {
    name: 'inject-runtime-config',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml: {
      order: 'pre' as const,
      handler(html: string) {
        return html.replace(
          '<head>',
          `<head>
    <script>window.__MENTORHUB_RUNTIME__=window.__MENTORHUB_RUNTIME__||{};</script>
    <script src="${base}runtime-config.js" vite-ignore></script>`
        )
      },
    },
  }
}
```

### Dev-server verification

`npm run api` (which runs `mh down` first) freed host port **8394** from the `mentee_spa` container before `npm run dev` was backgrounded; the two were never up together. Vite printed `Local: http://localhost:8394/mentee/` and bound **IPv6 loopback only** (`node ... TCP [::1]:8394 (LISTEN)`), so raw `curl` checks used `http://[::1]:8394`.

`curl` results:

| Request | Result |
|---|---|
| `GET /mentee/` | 200, HTML above, single `/mentee/` prefixes |
| `GET /mentee/paths/abc` | 200, same HTML (history fallback works under the base) |
| `GET /` | **302 → `/mentee/`** (Vite's base middleware; `npm run open` therefore still lands correctly in dev) |
| `GET /mentee/runtime-config.js` | 200 `text/javascript` |
| `GET /runtime-config.js` | 404 |
| `GET /mentee/api/config` | 401 unauthenticated from `gunicorn` — the prefixed proxy reaches the Mentee API |
| `GET /api/config` | 401 unauthenticated from `gunicorn` — the legacy proxy still works |

The rendering, redirect, and IdP round-trip items were then automated non-interactively with a **temporary** Cypress spec (`cypress/e2e/tmp-f130-verify.cy.ts`) run against the dev server — **5 of 5 passing**. The spec was **deleted** afterwards and left no screenshots, videos, or report files; `cypress/e2e/` is back to exactly `journey.cy.ts`, `path.cy.ts`, `resource.cy.ts`. F132 owns permanent prefixed Cypress coverage.

1. **`/` → `/mentee/journey` and the journey page renders.** `cy.login()` visits `/`, follows the 302 to `/mentee/`, and the router redirect lands on exactly `http://localhost:8394/mentee/journey`; `journey-detail-card` is visible and `page-frame-title` reads `Jane Mentee:Mentee`.
2. **`runtime-config.js` is requested from the prefixed path.** The intercepted request URL is exactly `http://localhost:8394/mentee/runtime-config.js`.
3. **`/mentee/paths/path-1`** renders `PathViewPage` (`path-view-browse-paths-link` visible, no `path-view-error`) at exactly that URL.
4. **`/mentee/resources/resource-1`** renders `ResourceViewPage` (`resource-view-card-title-display` contains `First Resource`) at exactly that URL.
5. **Logged-out deep link returns to the same prefixed URL.** Visiting `/mentee/paths/abc` with `localStorage` cleared produced the IdP URL with

   ```
   return_to=http://localhost:8394/mentee/paths/abc
   ```

   — prefix present exactly once, path preserved. (The IdP was pointed at a same-origin stub via `window.__MENTORHUB_RUNTIME__.IDP_LOGIN_URI` for that one test so Cypress could read the outgoing URL; that is the highest-priority source in the spa_utils resolution order and changes only the IdP host, not the `return_to` the app computes.)
6. **API calls succeed through the dev proxy.** The app's own startup `GET http://localhost:8394/api/config` returned **200** with the Cypress JWT, and a direct authenticated `cy.request('/mentee/api/config')` also returned **200** — so the new `/mentee/api` proxy rewrite (`/mentee/api/config` → `/api/config` on `:8393`) is correct even though `src/api/client.ts` still uses `/api` until F131.

### Cypress and packaging are not gates in this task

Stated explicitly, as the task requires: **`npm run container` / `npm run service` / `npm run cypress:run` were not run as gates and are expected to fail right now.** The container image's `nginx.conf.template` still serves only `/`, so a container built from this `dist/` would 404 on `/mentee/assets/...`, and `cypress.config.ts`'s `baseUrl` (`http://localhost:8394`) with un-prefixed `cy.visit('/paths/path-1')` calls cannot work against a prefixed app. **F131** ships the nginx prefix and **F132** re-points the specs. The unit-test suite (`npm run test`) plus `npm run build` are this task's gates and both pass.

### Files changed

**Updated (4) — exactly the task's Outputs, nothing else:**

- `vite.config.ts` — `const BASE = '/mentee/'` and `base: BASE`; `injectRuntimeConfig()` is now typed `Plugin`, reads the resolved base in `configResolved`, and emits `<script src="${base}runtime-config.js" vite-ignore>` (still `order: 'pre'`, still ahead of the bundle, seeded `window.__MENTORHUB_RUNTIME__` line kept); `server.proxy` gained `'/mentee/api'` → `http://localhost:8393` with `rewrite: (path) => path.replace(/^\/mentee/, '')`, keeping the existing `/api` proxy for direct-port debugging.
- `src/router/index.ts` — `createWebHistory(import.meta.env.BASE_URL)`; new module-level `appUrl(fullPath)` helper (`origin + BASE_URL + fullPath` without its leading slash, tolerating a base with no trailing slash) feeding `redirectToIdpLogin(appUrl(to.fullPath))`. `next(false)` kept, the `requiresRole` Discovery fallback untouched, and **every route `path` string is byte-identical to F128** (`/`, `/journey`, `/resources/:id`, `/paths/:id`, `/admin`).
- `index.html` — `<title>Mentee</title>`; the dead `/vite.svg` favicon link **deleted**.
- `README.md` — `npm run dev` documented as `http://localhost:8394/mentee/`; a **"Port 8394 is exclusive"** warning that `npm run dev` and `npm run service` cannot run at once (with the `npm run api` workaround); the Architecture Overview route table gained a **Browser URL** column carrying the F128 `/mentee/...` list plus a dev-vs-ALB origin note; and a new **"Base Path"** section under Key Implementation Patterns (base + `createWebHistory(BASE_URL)`, route paths stay unprefixed, the base-aware runtime-config injection and why it needs `vite-ignore`, the base-aware IdP `return_to`, and both dev proxies).

**Favicon choice: deleted the link.** The task allowed either deleting the dead `<link rel="icon" href="/vite.svg">` or making it base-aware. `public/` contains no `vite.svg` (only the two `runtime-config.js*` files), so making it base-aware would have moved a 404 from `/vite.svg` to `/mentee/vite.svg`. Deleting it removes the root-absolute reference and one failing request; browsers fall back to `/favicon.ico`. Adding a real icon asset is out of scope here.

No changes to `nginx.conf.template`, `Dockerfile`, `package.json`, `package-lock.json`, `cypress.config.ts`, `vitest.config.ts`, `public/runtime-config.js`, `public/runtime-config.js.template`, `.env.development`, `src/App.vue`, `src/api/client.ts`, any other `src/**` file, or any Cypress spec. `git status` shows exactly `README.md`, `index.html`, `src/router/index.ts`, `vite.config.ts`, and this task file. There is **exactly one** `base` and one build — no second root-only build or profile was added.

### Notes for F131 (container nginx serves `/mentee/`)

Concrete facts from this build, so F131 does not have to re-derive them:

- **Docroot layout is flat.** `base` changed URLs only. `dist/` is `index.html`, `runtime-config.js`, `runtime-config.js.template`, `assets/`. There is no `dist/mentee/`, so nginx must map the URL prefix onto the same docroot (e.g. `alias`, or `root` plus a `rewrite`/`try_files` that strips `/mentee`) rather than expecting a `mentee/` subdirectory. The `Dockerfile`'s startup `envsubst` writes `runtime-config.js` next to `index.html`, which stays correct.
- **Exact URLs the built `index.html` requests:** `/mentee/runtime-config.js`, `/mentee/assets/index-<hash>.js`, `/mentee/assets/index-<hash>.css`. Lazy route chunks and the Material Design Icons font files are all `/mentee/assets/<name>-<hash>.<ext>` too (`AdminPage`, `JourneyEditPage`, `PathViewPage`, `ResourceViewPage`, `ResourceViewCard...`, `materialdesignicons-webfont.*`). One `location /mentee/assets/` mapped to `<docroot>/assets/` covers every hashed asset.
- **`runtime-config.js` needs its own prefixed location.** Today's `location = /runtime-config.js` no longer matches; it becomes `location = /mentee/runtime-config.js` serving `<docroot>/runtime-config.js`. If it 404s the app silently falls back to the compiled Developer Edition IdP URL instead of failing loudly (see the surprise below).
- **History fallback must be under the prefix.** `/mentee/journey`, `/mentee/paths/{id}`, `/mentee/resources/{id}`, `/mentee/admin` all have to serve `index.html`. The dev server also answers **302 `/` → `/mentee/`**, which is the behavior the task's `location = /` redirect should mirror — worth keeping because `npm run open` (in the do-not-change `package.json`) still opens `http://localhost:8394` with no prefix.
- **API prefix.** The `/mentee/api` dev proxy is already proven to work with a `^/mentee` strip (authenticated `200` from `/mentee/api/config`), so nginx should proxy `/mentee/api/` to `${API_HOST}:${API_PORT}/api/` — the API still expects `/api/...`. `src/api/client.ts` is untouched and still calls `/api`; switching it to a `BASE_URL`-derived `/mentee/api` is F131's job, and only then does the nginx prefix location get exercised by the app.
- **Do not touch route `path` strings** when adding the prefix anywhere; the base already supplies it.

### Follow-ups and surprises

1. **`VITE_IDP_LOGIN_URI` is inert for the packaged spa_utils — pre-existing, not caused by this task.** `node_modules/@mentor-forge/mentorhub_spa_utils/dist/index.js` inlined *its own* build-time env (`{ BASE_URL: "/", DEV: false, MODE: "production", ... }`), so the `VITE_IDP_LOGIN_URI` lookup in its resolution order can never see this repo's `.env.development` (or `vitest.config.ts`) value. In practice the order is `window.__MENTORHUB_RUNTIME__.IDP_LOGIN_URI` → compiled fallback `http://127.0.0.1:8080/login.html`. It happens to be harmless today because `.env.development` sets exactly that fallback value, but it means a missing or mis-served `runtime-config.js` degrades **silently**. Worth a spa_utils issue; not worked around here.
2. **spa_utils base-aware logout `return_to`** — unchanged from the F129 follow-up, now actually observable: `PageFrame.handleLogout()` sends `return_to=${origin}/`, so a logged-out user lands on the welcome root instead of `/mentee/`. Deliberately not fixed here (compiled into spa_utils, no host prop).
3. **Transient broken packaging between F130 and F131.** With `base` shipped but nginx still on `/`, a locally built container serves `index.html` at `/` whose assets are all `/mentee/...` → 404. Expected and covered by F131; `README.md` was intentionally not edited to describe this transient state.
4. **`npm run test:coverage` still fails — pre-existing and untouched.** `src/components/**` is 0% (no component tests exist) and `src/composables/**` branches sit just under the 60% threshold. This task added no composable or component. `npm run test` (47/47) is the gate.
5. **`npm run lint` still does not exist** (carried from F127-F129). `npm run build` (`vue-tsc`) remains the type gate.
6. **Environment left as:** dev server **killed** (nothing listening on 8394), and the container stack is the `npm run api` set — mongodb, mongodb_api, mongodb_spa, mentee_api, welcome — with **no `mentee_spa` container**, since `npm run api` runs `mh down` first. Re-run `mh up mentee` (after `npm run container`) when F131 needs the full stack.
