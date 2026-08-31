# F131 – SPA nginx `/mentee/` prefix and prefixed API client

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F130_vite_base_and_router_prefix`  
**Description**: Teach container nginx to serve the `/mentee/` prefix (assets, Vue history fallback, prefixed API proxy, prefixed `runtime-config.js`) and switch the API client to the prefixed `/mentee/api` base so calls from the welcome origin reach `mentee_api` through this SPA's nginx. Keep direct-port `/api/` and `/runtime-config.js` for debugging.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — container NGINX template substitution; runtime config generated at startup
- `../mentorhub_spa_utils/README.md` — **Cross-SPA URLs**: welcome / ALB origin on `:8080`; direct SPA debug ports (including **8394**) are for Cypress, OpenAPI, and debugging only
- `README.md` — Configuration section (`API_HOST` / `API_PORT`; container listens on port 80)
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `nginx.conf.template` — today: `location /api/` proxying to `http://${API_HOST}:${API_PORT}/api/`, `location /health`, `location = /runtime-config.js` with `Cache-Control: no-store`, `location /` history fallback, and a root static-asset cache regex; **no prefix awareness**
- `Dockerfile` — `ENV API_HOST=mentorhub_mentee_api`, `ENV API_PORT=8393`, `ENV IDP_LOGIN_URI=http://127.0.0.1:8080/login.html`; `CMD` already `envsubst`s `${API_HOST} ${API_PORT}` into the nginx config **and** `${IDP_LOGIN_URI}` from `runtime-config.js.template` into `/usr/share/nginx/html/runtime-config.js`
- `vite.config.ts` — F130 `base: '/mentee/'` (asset **URLs** are prefixed; the build **output folder is still the dist root**)
- `src/api/client.ts` — `const API_BASE = '/api'`
- `src/api/client.test.ts`, `src/api/Journey.client.test.ts`, `src/api/Path.client.test.ts`, `src/api/Resource.client.test.ts` — assert fetch URLs such as `/api/config`, `/api/journey`, `/api/path/...`, `/api/resource/...`
- `package.json` — `open` currently opens `http://localhost:8394`

**External prerequisites** (do not change other repos):

- Developer Edition welcome nginx (mentorhub L022) already proxies `:8080/mentee/*` to this container **without stripping the prefix** (`proxy_pass $upstream;` with no URI part), so this nginx must accept `/mentee/...` on port 80.
- Compose passes `API_HOST`, `API_PORT` (**8393**), and `IDP_LOGIN_URI` to the `mentee_spa` service.
- `IDP_LOGIN_URI` stays `http://<HOST_NAME>:8080/login.html`.

**Already in place — expect no Dockerfile change.** The startup `envsubst` that generates `runtime-config.js` and the `IDP_LOGIN_URI` default already ship in this repo. Confirm the generated file still lands at `/usr/share/nginx/html/runtime-config.js` (the Vite `public/` copy puts `runtime-config.js.template` in the dist root regardless of `base`) and touch the `Dockerfile` only if that assumption fails.

Vite `base` does **not** move files into `dist/mentee/`. Nginx must map `/mentee/` onto `/usr/share/nginx/html/`; an internal `rewrite` is the expected mechanism. Keep a **single** image and build — no root-only nginx profile.

## Goals

- `nginx.conf.template`:
  - `location /mentee/api/` proxies to `http://${API_HOST}:${API_PORT}/api/` with the same proxy headers as the existing `/api/` block (port **8393** via `${API_PORT}`).
  - `location /api/` is kept unchanged for **direct-port** debugging.
  - `location /mentee/` maps the prefix onto the dist root (internal `rewrite`) and falls back to `/index.html` for Vue history mode; the HTML response is **not** cached (`no-store`), because a stale shell with the wrong asset URLs breaks behind welcome on `:8080`.
  - A prefixed static-asset location serves and caches `/mentee/*.{js,css,png,jpg,jpeg,gif,ico,svg,woff,woff2,ttf,eot}` from the dist root as `public, immutable`; the existing root-path asset cache regex stays for direct-port debugging. Watch ordering — nginx regex locations beat prefix locations, so verify the prefixed asset rule actually wins and does not swallow `/mentee/api/`.
  - `location = /` returns a redirect to `/mentee/` so `http://<host>:8394/` still reaches the app.
  - `location = /mentee/runtime-config.js` **and** the existing `location = /runtime-config.js` both serve the generated file with `Cache-Control: no-store` (never the immutable asset cache). Neither may 404.
  - `location /health` is kept unchanged for container health.
  - No other journey SPA, and no other domain's `/api`, is proxied from this container.
- `src/api/client.ts` derives the API base from the Vite base rather than hardcoding `/api`, yielding `/mentee/api` in the browser (for example `` `${import.meta.env.BASE_URL}api` `` normalized to a single slash). All requests keep sending `Authorization: Bearer <token>` and `Content-Type: application/json`, and keep the existing `401` logout-and-redirect handling and `204` / empty-body handling. The `offset` / `size` header pattern is already gone (F128), so no list method needs revisiting.
- `src/api/client.test.ts`, `src/api/Journey.client.test.ts`, `src/api/Path.client.test.ts`, and `src/api/Resource.client.test.ts` assert the prefixed URLs (`/mentee/api/...`) instead of `/api/...`, and still cover the `401` path and error mapping. The `src/api/**` coverage thresholds in `vitest.config.ts` must still pass.
- `package.json` `open` script opens `http://localhost:8394/mentee/`.
- `README.md` documents: welcome origin `http://<host>:8080/mentee/` is the supported browser entry; `http://localhost:8394/mentee/` is direct-port debugging only; API calls reach `mentee_api` via this SPA's nginx at `/mentee/api/`.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test`
- `npm run build` — `vue-tsc` is the type gate (this repo defines no `lint` script)

**Packaging verification:**

- `npm run container` — build the SPA container image
- `npm run service` — run db + API + SPA containers, then verify with `curl -i`:
  - `http://localhost:8394/` redirects (30x) to `/mentee/`
  - `http://localhost:8394/mentee/` returns `200 text/html` with the app shell and `/mentee/` asset URLs (not a 404, not welcome's `index.html`)
  - `http://localhost:8394/mentee/journey` and `http://localhost:8394/mentee/paths/anything` return `200 text/html` through the history fallback
  - `http://localhost:8394/mentee/runtime-config.js` returns `200`, `Cache-Control: no-store`, and contains the compose `IDP_LOGIN_URI` value
  - `http://localhost:8394/runtime-config.js` also returns `200` `no-store`
  - `http://localhost:8394/mentee/api/config` and `http://localhost:8394/api/config` both reach `mentee_api` (an unauthenticated `401` JSON body is acceptable; HTML from a missing location is a failure)
  - a prefixed JS asset returns `200` with `Cache-Control: public, immutable`
  - `http://localhost:8394/health` returns `healthy`
- If Developer Edition welcome is up on `:8080`, also confirm `http://localhost:8080/mentee/` returns this SPA rather than welcome's `index.html`. If welcome is not part of the running stack, record it as an external check — do not change other repos.
- `npm run cypress:run` is **not** a gate in this task: the specs still visit un-prefixed paths and are re-pointed in F132. Note that in Execution Notes.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `nginx.conf.template` — `/mentee/`, `/mentee/api/`, prefixed asset cache, `/` redirect, dual `runtime-config.js`
- `src/api/client.ts` — base-derived `/mentee/api`
- `src/api/client.test.ts`, `src/api/Journey.client.test.ts`, `src/api/Path.client.test.ts`, `src/api/Resource.client.test.ts` — prefixed URL assertions
- `package.json` — `open` URL `/mentee/`
- `README.md` — prefixed URLs and proxy boundaries
- `Dockerfile` — only if the generated `runtime-config.js` does not land in the served root

Do not change `vite.config.ts`, `src/router/index.ts`, `src/App.vue`, `cypress.config.ts`, `vitest.config.ts`, or any page or component in this task.

## Execution Notes

### Plan
- Mirror the shipped admin/discovery/customer/mentor nginx prefix pattern, swapping in `/mentee/`:
  - `location /mentee/api/` + keep `location /api/` (same proxy headers, `${API_HOST}:${API_PORT}` → `/api/`)
  - `location /mentee/` rewrite onto dist root + `try_files` history fallback + HTML `Cache-Control: no-store`
  - Prefixed asset regex `^/mentee/(.*\.(js|css|...))$` **before** the root-path asset regex so it wins; neither regex matches `/mentee/api/` (no asset extension)
  - Exact `location = /mentee/runtime-config.js` (try_files `/runtime-config.js`) and keep `location = /runtime-config.js`; both `no-store` so they beat the immutable asset cache
  - `location = /` → `302 /mentee/` with `absolute_redirect off`
  - Keep `location /health` and a root `location /` fallback for direct-port debug
- `src/api/client.ts`: `API_BASE` from Vite `BASE_URL` (`${import.meta.env.BASE_URL.replace(/\/$/, '')}/api` → `/mentee/api`). Auth, 401, 204, Content-Type unchanged.
- Client tests: replace `/api/...` assertions with `/mentee/api/...`. If Vitest still sees `BASE_URL=/` (standalone `vitest.config.ts` has no `base`), add `base: '/mentee/'` there — sibling SPAs did this; it is the only way prefixed assertions can pass. Note as a necessary Outputs exception if required.
- `package.json` `open` → `http://localhost:8394/mentee/`.
- `README.md`: welcome `:8080/mentee/` is the supported browser entry; `:8394/mentee/` is direct-port debug only; API via this SPA's nginx at `/mentee/api/`.
- Dockerfile: no change expected (`runtime-config.js` already generated at `/usr/share/nginx/html/runtime-config.js`).
- **Do not run Cypress as a gate.** Specs still visit un-prefixed paths and are re-pointed in F132.
- Testing: `npm run test`, `npm run build`, then `npm run container` + `npm run service` and the listed `curl -i` checks. Env: `GITHUB_FOREVER_TOKEN`, `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html`.
- Leave Status Pending. No commit/push.

### Implemented
- `nginx.conf.template`: prefixed `/mentee/api/` proxy (kept `/api/`), `/mentee/` rewrite + history fallback + HTML `no-store`, prefixed asset cache regex before the root asset regex, `location = /` → `302 /mentee/` (`absolute_redirect off`), dual `runtime-config.js` (`/mentee/` + root, both `no-store`), `/health` unchanged.
- `src/api/client.ts`: `API_BASE` is `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api` → `/mentee/api`. Authorization, Content-Type, 401 logout/redirect, and 204/empty-body handling unchanged.
- Client tests assert `/mentee/api/...` (config, journey, path, resource, aggregation).
- `package.json` `open` → `http://localhost:8394/mentee/`.
- `README.md`: welcome `:8080/mentee/` supported entry; `:8394/mentee/` debug only; API via this SPA's nginx at `/mentee/api/`.
- `Dockerfile`: **not changed**. Startup `envsubst` still writes `/usr/share/nginx/html/runtime-config.js`; prefixed location `try_files /runtime-config.js`.
- `vitest.config.ts`: **necessary Outputs exception** — added `base: '/mentee/'` so Vitest `BASE_URL` matches Vite. Without it, tests still fetched `/api/...` (standalone vitest config does not inherit `vite.config.ts` `base`). Same one-liner as mentor/admin/customer/discovery.

### Cypress
**Not run as a gate.** Specs still visit un-prefixed paths and are re-pointed in F132.

### Test results
- `npm run test`: 10 files, 47 tests passed (after `vitest.config.ts` `base`).
- `npm run build`: `vue-tsc && vite build` succeeded.
- `npm run container`: image `ghcr.io/mentor-forge/mentorhub_mentee_spa:latest` built.
- `npm run service`: first `mh up mentee` failed GHCR login (`~/.mentorhub/GITHUB_TOKEN` stale). Retried with `GITHUB_TOKEN` from `~/.mentorhub/GITHUB_FOREVER_TOKEN` and `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` — stack came up (welcome, db, mentee_api, mentee_spa).

### Curl verification (`localhost:8394` unless noted)
| Check | Result |
|---|---|
| `GET /` | **302** `Location: /mentee/` |
| `GET /mentee/` | **200** `text/html`, title `Mentee`, assets `/mentee/assets/...`, `Cache-Control: no-store` (not welcome `index.html`) |
| `GET /mentee/journey` | **200** `text/html` (history fallback) |
| `GET /mentee/paths/anything` | **200** `text/html` (history fallback) |
| `GET /mentee/runtime-config.js` | **200**, `Cache-Control: no-store`, body `IDP_LOGIN_URI: 'http://127.0.0.1:8080/login.html'` |
| `GET /runtime-config.js` | **200**, `Cache-Control: no-store`, same body |
| `GET /mentee/api/config` | **401** JSON `Missing or invalid Authorization header` (reaches mentee_api) |
| `GET /api/config` | **401** JSON same body |
| `GET /mentee/assets/index-B2XwRbvJ.js` | **200** `application/javascript`, `Cache-Control: public, immutable` |
| `GET /health` | **200** `healthy` |
| `GET http://localhost:8080/mentee/` | **200** this SPA (title `Mentee`, `/mentee/` assets) — welcome was in the mentee profile |

### Follow-ups
- F132: re-point Cypress visits/intercepts under `/mentee/` and treat `cypress:run` as a packaging gate.
- Planner gap: F131 Outputs omitted `vitest.config.ts` `base`; sibling SPAs already have it. Leave as-is unless F132 wants to own the file.
