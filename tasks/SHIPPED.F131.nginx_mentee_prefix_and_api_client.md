# F131 – SPA nginx `/mentee/` prefix and prefixed API client

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F130_vite_base_and_router_prefix`  
**Description**: Update this SPA's nginx configuration template so the container serves the `/mentee/` prefix, proxies `/mentee/api/` to `mentee_api`, serves `/mentee/runtime-config.js`, falls back to `/index.html` for Vue history mode, and redirects `/` to `/mentee/`. Re-point the API client base to `/mentee/api` so all requests route through the prefixed proxy in both dev and production. Route paths stay unprefixed.

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

- `nginx.conf.template` serves the `/mentee/` prefix:
  - `location /mentee/api/` proxies to `http://${API_HOST}:${API_PORT}/api/` with the standard proxy headers (`Upgrade`, `Connection`, `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, `proxy_cache_bypass`) and `proxy_http_version 1.1`
  - `location /api/` is kept unchanged for direct-port debugging
  - `location = /mentee/runtime-config.js` serves `/runtime-config.js` with `add_header Cache-Control "no-store"; try_files /runtime-config.js =404;`
  - `location = /runtime-config.js` is kept for direct-port debugging with `add_header Cache-Control "no-store";`
  - `location /mentee/` maps the prefix onto the dist root (`rewrite ^/mentee/(.*)$ /$1 break;`), falls back to `/index.html` for Vue Router history mode (`try_files $uri $uri/ /index.html;`), and sets `add_header Cache-Control "no-store";` so HTML shells are never cached
  - `location = /` returns a `302 /mentee/;` redirect so direct hits to port 8394 land on the prefixed app (Vue route `/` redirects to `/journey` after that)
  - `location /` fallback is kept for direct-port debugging (`try_files $uri $uri/ /index.html; add_header Cache-Control "no-store";`)
  - static asset caching regex covers both prefixed assets (`location ~* ^/mentee/(.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))$` rewritten to `/$1`) and unprefixed assets with `expires 1y; add_header Cache-Control "public, immutable";`
  - `location /health` is unchanged
- `src/api/client.ts` derives `API_BASE` from Vite's base path:
  ```typescript
  const API_BASE = `${import.meta.env.BASE_URL || '/'}api`.replace(/\/+/g, '/')
  ```
  In browser runs under `base: '/mentee/'`, `API_BASE` resolves to `'/mentee/api'`. Do not hardcode `http://localhost:8393` or the welcome origin.
- `src/api/client.test.ts`, `src/api/Journey.client.test.ts`, `src/api/Path.client.test.ts`, and `src/api/Resource.client.test.ts` are updated so their `expect(mockFetch).toHaveBeenCalledWith(...)` assertions match the prefixed `/mentee/api/...` URLs and all unit tests pass.
- `package.json` `open` script updates to target `http://localhost:8394/mentee/`.
- `README.md` documents that welcome origin `http://<host>:8080/mentee/` is the supported browser entry, `http://localhost:8394/mentee/` is direct-port debugging only, and API calls reach `mentee_api` via this SPA's nginx at `/mentee/api/`.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test` — all unit test suites (`src/api/*.client.test.ts`, `src/api/client.test.ts`, `src/App.test.ts`, etc.) must pass with the new `/mentee/api` base
- `npm run build` — `vue-tsc` type check passes
- `npm run cypress:run` is **not** a gate in this task: the specs still visit un-prefixed paths and are re-pointed in F132. Note that in Execution Notes.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `nginx.conf.template` — `/mentee/`, `/mentee/api/`, prefixed asset cache, `/` redirect, dual `runtime-config.js`
- `src/api/client.ts` — base-derived `/mentee/api`
- `src/api/client.test.ts`, `src/api/Journey.client.test.ts`, `src/api/Path.client.test.ts`, `src/api/Resource.client.test.ts` — prefixed URL assertions
- `package.json` — `open` URL `/mentee/`
- `README.md` — prefixed URLs and proxy boundaries

Do not change `Dockerfile`, `vite.config.ts`, `src/router/index.ts`, or `src/components/**` in this task.

## Execution Notes

- **Plan**: Updated `nginx.conf.template` with `/mentee/api/` proxy, dual `runtime-config.js` locations, `/mentee/` prefix mapping with rewrite and no-store, root 302 redirect to `/mentee/`, and static asset cache regex. Updated `src/api/client.ts` to derive `API_BASE` from `import.meta.env.BASE_URL`. Set `base: '/mentee/'` in `vitest.config.ts` and updated unit test fetch expectations in `src/api/client.test.ts`, `src/api/Journey.client.test.ts`, `src/api/Path.client.test.ts`, and `src/api/Resource.client.test.ts`. Updated `open` script in `package.json` and updated `README.md`.
- **Cypress gate note**: Cypress test rewriting and packaging run is deferred to F132.
- **Test results**:
  - `npm run test` -> 10 test files passed, 47 tests passed.
  - `npm run build` -> `vue-tsc && vite build` built cleanly with no errors.
