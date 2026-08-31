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
- `vite.config.ts`: set `base: '/mentee/'` (single build). Make `injectRuntimeConfig` read resolved `config.base` and emit `<script src="${base}runtime-config.js">` (still `pre`, seed line kept). Add `'/mentee/api'` proxy → `localhost:8393` with rewrite that strips `/mentee`; keep existing `/api` proxy.
- `src/router/index.ts`: `createWebHistory(import.meta.env.BASE_URL)`. Leave every route `path` unprefixed. IdP return URL = `origin + BASE_URL + to.fullPath` without leading slash. Keep `next(false)`.
- `index.html`: title `Mentee`. Delete the dead `/vite.svg` favicon link (file is not in `public/`).
- `README.md`: document `http://localhost:8394/mentee/`, F128 in-app URLs, and the port-8394 `dev` vs `service` conflict.
- Do not change nginx, Dockerfile, package.json, cypress.config, client.ts, vitest, public runtime-config, App.vue.
- Testing: `npm run test`, `npm run build`, inspect `dist/index.html` for `/mentee/` assets (no `/mentee/mentee`), confirm no `dist/mentee/` folder. Manual `api`+`dev` if feasible.
- **Do not run Cypress as a gate.** Specs still hit unprefixed paths and container nginx still serves `/` until F131/F132.

### Implemented
- `vite.config.ts`: `base: '/mentee/'`; `injectRuntimeConfig` reads `config.base` and emits `<script src="${base}runtime-config.js" vite-ignore>` (`pre`, seed line kept). `vite-ignore` is required — without it Vite 7 rewrites the already-prefixed src to `/mentee/mentee/runtime-config.js` on the dev server. Added `'/mentee/api'` → `localhost:8393` with rewrite stripping `/mentee`; kept `/api`.
- `src/router/index.ts`: `createWebHistory(import.meta.env.BASE_URL)`. Route `path` strings unchanged (`/`, `/journey`, `/resources/:id`, `/paths/:id`, `/admin`). IdP return URL is `window.location.origin + import.meta.env.BASE_URL + to.fullPath.replace(/^\//, '')`. `next(false)` kept.
- `index.html`: title `Mentee`. **Deleted** the dead `/vite.svg` favicon link (file is not in `public/`); did not make it base-aware.
- `README.md`: `npm run dev` at `http://localhost:8394/mentee/`, F128 in-app route table, port-8394 `dev` vs `service` conflict warning.

### Cypress
**Not run as a gate.** `npm run cypress:run` is expected to fail until F131 (prefixed nginx + API client) and F132 (prefixed specs).

### Test results
- `npm run test`: 10 files, 47 tests passed. No unit test asserted an un-prefixed IdP return URL, so none were updated.
- `npm run build`: `vue-tsc && vite build` succeeded.
- `dist/index.html`: module bundle `/mentee/assets/index-BvBBgYAu.js`, CSS `/mentee/assets/index-DPA2ijAz.css`, `runtime-config.js` at `/mentee/runtime-config.js`. No `/mentee/mentee`. No `dist/mentee/` folder. `runtime-config.js` and `runtime-config.js.template` copied to dist root.

### Manual `api` + `dev`
`npm run dev` on **8394** was not feasible: `mentorhub-mentee_spa-1` already binds that port (the documented `dev` vs `service` conflict). API was already up on 8393. Smoke-checked a throwaway Vite on port 18394 instead:
- `GET /mentee/` → 200 HTML with `/mentee/runtime-config.js` (not `/mentee/mentee/...`)
- `GET /mentee/runtime-config.js` → 200 `text/javascript`
- `GET /mentee/paths/demo-id` and `/mentee/resources/demo-id` → 200 HTML (history fallback)
- `GET /mentee/api/config` and `/api/config` → 401 JSON from gunicorn (proxy rewrite reaches mentee_api)
- Client-side `/` → `/journey` redirect and IdP deep-link return were not browser-verified (no browser tools; 8394 occupied by the un-prefixed container).

### Follow-ups
- F131: container nginx `/mentee/` + prefixed API client (`src/api/client.ts`).
- F132: Cypress visits under `/mentee/` and packaging verification.
- Browser check of `/mentee/` → `/mentee/journey` and logged-out deep-link return once 8394 is free for `npm run dev`.
