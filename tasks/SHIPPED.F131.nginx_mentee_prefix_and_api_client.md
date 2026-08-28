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

1. Read this task, `tasks/_ORCHESTRATE.md` ("Task execution workflow"), `tasks/_PLANNING.md`, `tasks/SHIPPED.F130...` (especially its "Notes for F131"), `ArchitecturePrinciples.md`, `spa_standards.md`, the spa_utils README "Cross-SPA URLs" section, plus the current `nginx.conf.template`, `Dockerfile`, `src/api/client.ts`, the four api test files, `package.json`, `README.md`, `vite.config.ts`, and `vitest.config.ts`.
2. Determine what `import.meta.env.BASE_URL` resolves to under Vitest before writing the client, because `vitest.config.ts` sets no `base` and may not be changed in this task.
3. `src/api/client.ts`: replace `const API_BASE = '/api'` with a base-derived value, keeping the `Authorization` / `Content-Type` headers, the `401` logout-and-redirect, and the `204` / empty-body handling byte-identical.
4. Update the four api test files to assert `/mentee/api/...`, still covering the `401` path and error mapping.
5. `nginx.conf.template`: add the prefixed API proxy, the prefixed app shell with history fallback, the prefixed asset cache, the `/` redirect, and the prefixed `runtime-config.js`; keep `location /api/`, `location /health`, `location /`, the root asset regex, and the existing `location = /runtime-config.js` for direct-port debugging.
6. Validate the nginx config **before** the container build, using a throwaway `nginx:stable-alpine` container over a synthetic flat docroot, so location-ordering mistakes are found in seconds rather than after an image build.
7. `package.json` `open` URL, then `README.md`.
8. Verify: `npm run test`, `npm run build`, `npm run container`, `npm run service`, then the full `curl -i` list. Also check welcome on `:8080`.

### Commands run

```sh
npx vitest run tmp-base-probe.test.ts        # temporary BASE_URL probe, deleted after the run
docker run --rm ... nginx -t -c /tmp/nginx.conf     # config syntax check
docker run -d --name f131probe -p 18394:80 ...     # throwaway nginx over a synthetic flat docroot
curl -s -i http://localhost:18394/<every path>     # location-ordering verification, pre-build
docker rm -f f131probe                             # torn down; temp docroot removed
npm run test                                       # 52/52
npm run test:coverage                              # src/api 99.01 / 88.46 / 100 / 99.01
npm run build                                      # vue-tsc clean
rg -o '\/mentee\/*\/api' dist/assets/index-*.js    # base inlined in the bundle
npm run container                                  # image built
npm run service                                    # mh down && mh up mentee && npm run open
curl -s -i http://localhost:8394/<every path>      # packaging gate
curl -s -i http://localhost:8080/mentee/...        # welcome origin check
docker exec mentorhub-mentee_spa-1 ls -la /usr/share/nginx/html
npm run cypress:run                                # informational only, NOT a gate
```

### `BASE_URL` under Vitest — the constraint that shaped the client

`vitest.config.ts` sets no `base`, and it is on this task's do-not-change list, so `import.meta.env.BASE_URL` is **`/`** in unit tests. A temporary probe spec confirmed the exact behavior:

| Read | Value |
|---|---|
| raw `import.meta.env.BASE_URL` | `"/"` |
| after `vi.stubEnv('BASE_URL', '/mentee/')` | `"/mentee/"` |
| read again lazily inside a function | `"/mentee/"` |
| after `vi.unstubAllEnvs()` | `"/"` |

Vite only inlines `import.meta.env.*` statically at **build** time; under Vitest it is a live object, so `vi.stubEnv` works. The consequence is that the base must be read **at call time**, not captured in a module-level `const` — a `const` is evaluated during the hoisted import, before any `beforeEach` stub can run. Hence `apiBase()`:

```typescript
/**
 * Same-origin API base derived from the Vite base, so the browser sends
 * `/mentee/api/...` and this SPA's nginx (or the dev proxy) strips the prefix
 * before the request reaches the Mentee API. Resolved per request so the base
 * is read at call time rather than captured at module load.
 */
function apiBase(): string {
  return `${import.meta.env.BASE_URL}/api`.replace(/\/{2,}/g, '/')
}
```

and the single call site changed from `` fetch(`${API_BASE}${endpoint}`, …) `` to `` fetch(`${apiBase()}${endpoint}`, …) ``. Inserting `/` and then collapsing runs of slashes is tolerant of a base with **or** without a trailing slash: `/mentee/` → `/mentee/api`, `/mentee` → `/mentee/api`, `/` → `/api`. Nothing else in `client.ts` changed — the `Authorization: Bearer` header, `Content-Type: application/json`, the `401` `logout()` + `redirectToIdpLogin()` branch, the `ApiError` mapping, and the `204` / `content-length: 0` empty-body return are byte-identical.

The built bundle proves the derivation survives Vite's build-time inlining:

```js
function N1(){return"/mentee//api".replace(/\/{2,}/g,"/")}
```

### `nginx.conf.template` — design and location ordering

Verified **before** the image build against a throwaway `nginx:stable-alpine` container on port 18394, mounting the real template over a synthetic flat docroot (`index.html`, `runtime-config.js`, `assets/index-abc123.js`) with `API_HOST=127.0.0.1 API_PORT=9999`, so a `502` positively identifies a request that reached the proxy location. `nginx -t` passed, then every path was curled. Two real defects were caught this way and fixed before the build:

1. **Deep links lost `no-store`.** With `try_files $uri /index.html`, the fallback is the *last* parameter, so nginx does an **internal redirect** to `/index.html`, which re-enters location matching, lands in `location /`, and drops this location's `add_header`. `/mentee/journey` returned `200 text/html` with **no** `Cache-Control`. Fix: `try_files $uri /index.html =404`. With a trailing code, `/index.html` becomes a non-last entry, is served in the current location, and keeps `no-store`.
2. **The redirect dropped the published port.** `return 302 /mentee/` with nginx's default `absolute_redirect on` produced `Location: http://localhost/mentee/` — the container listens on 80, so `$host` plus the *listening* port yields no port at all, and `http://localhost:8394/` would have sent the browser to `:80`. Fix: `absolute_redirect off` in both redirect locations, giving a relative `Location: /mentee/`.

The ordering rules that make the rest work:

- **Exact (`=`) matches short-circuit everything**, including regexes. That is what keeps `location = /mentee/runtime-config.js` and `location = /runtime-config.js` out of the immutable asset cache even though both end in `.js` and the asset regexes would otherwise match.
- **Regex locations beat plain prefix locations**, and regexes are tested top-to-bottom. `location /mentee/` is therefore deliberately a **plain** prefix (not `^~`): `^~` on it would suppress regex evaluation and the prefixed asset regex would never run. The prefixed asset regex is placed **ahead of** the root-path one so it wins for `/mentee/assets/...`.
- **`^~` on `/mentee/api/`** suppresses regex evaluation for the API, so an API path ending in `.js` can never be captured by the asset cache.

Evidence for each of those three claims, from the running container:

| Check | Result | What it proves |
|---|---|---|
| `/mentee/assets/index-B2_mCQ8l.js` | `200`, `Content-Length: 727766`, `Cache-Control: public, immutable` | The prefixed asset regex won. Had the **root** regex won, the path would have resolved to `<docroot>/mentee/assets/...` and 404'd. |
| `/mentee/runtime-config.js` | `200`, `Cache-Control: no-store` (no `Expires`) | The exact match beat both asset regexes. |
| `/mentee/api/config.js` | `404` with Werkzeug's HTML error page (`<title>404 Not Found</title>`, `Content-Type: text/html; charset=utf-8`, no `Cache-Control`) | `^~` sent a `.js` API path upstream. Nginx's own 404 is `Content-Length: 153`; this body is the API's. |
| `/mentee/assets/missing.js` | `404`, `Content-Length: 153` (nginx page) | The prefixed asset regex is a real static handler, not the history fallback. |

**No `Dockerfile` change was needed.** The generated file lands exactly where the task predicted:

```
$ docker exec mentorhub-mentee_spa-1 ls -la /usr/share/nginx/html
-rw-r--r--  539  Aug 28 18:54  index.html
-rw-r--r--  153  Aug 28 18:55  runtime-config.js          <- generated at container start
-rw-r--r--  123  Aug 28 18:54  runtime-config.js.template <- copied from public/ by the build
drwxr-xr-x       Aug 28 18:54  assets
```

The `18:55` mtime on `runtime-config.js` versus `18:54` on everything else is the startup `envsubst` writing it. `Dockerfile` untouched.

### Test results

**`npm run test`** — **PASS**: 10 test files, **52 tests passed, 0 failed**. Baseline was 47; the five additions are two API-base derivation cases, two empty-body cases (`204` and `content-length: 0`), and one `ApiError` mapping case. All four api test files now stub `BASE_URL` to `/mentee/` in `beforeEach` and `vi.unstubAllEnvs()` in `afterEach`, and assert `/mentee/api/...`:

- `client.test.ts` — `/mentee/api/config` with both `Content-Type` and `Authorization` asserted; the `401` test additionally asserts the prefixed URL before checking `logout()` and `redirectToIdpLogin()`; a `/` base case asserts `/api/config` so the *derivation* is tested rather than a hardcoded string.
- `Journey.client.test.ts` — all 8 URL assertions prefixed; the `404`, `401`, and network-error tests unchanged.
- `Path.client.test.ts` — `/mentee/api/path/507f1f77bcf86cd799439011`.
- `Resource.client.test.ts` — `/mentee/api/resource/...` and `/mentee/api/aggregation/...`.

**`src/api/**` coverage thresholds still pass** (90 / 90 / 75 / 90 required): **99.01% statements, 88.46% branches, 100% functions, 99.01% lines**. `npm run test:coverage` as a whole still fails on the **pre-existing** `src/components/**` (0%, no component tests exist) and `src/composables/**` (59.57% branches) thresholds — carried unchanged from F130 follow-up #4; this task added no component or composable.

**`npm run build`** — **PASS**: `vue-tsc` clean, 651 modules transformed, same as F130. Only the pre-existing >500 kB chunk advisory.

### Packaging verification — `curl -i` against `http://localhost:8394`

| Request | Status | Relevant headers | Body evidence |
|---|---|---|---|
| `GET /` | **302** | `Location: /mentee/` | relative, so the published port is preserved |
| `GET /mentee` | **302** | `Location: /mentee/` | |
| `GET /mentee/` | **200** | `Content-Type: text/html`, `Cache-Control: no-store` | `<title>Mentee</title>`; asset URLs `/mentee/runtime-config.js`, `/mentee/assets/index-B2_mCQ8l.js`, `/mentee/assets/index-DPA2ijAz.css` |
| `GET /mentee/journey` | **200** | `text/html`, `no-store` | same shell (history fallback) |
| `GET /mentee/paths/anything` | **200** | `text/html`, `no-store` | same shell |
| `GET /mentee/resources/anything` | **200** | `text/html`, `no-store` | same shell |
| `GET /mentee/admin` | **200** | `text/html`, `no-store` | same shell |
| `GET /mentee/runtime-config.js` | **200** | `application/javascript`, `Cache-Control: no-store` | `IDP_LOGIN_URI: 'http://m5max.tailb0d293.ts.net:8080/login.html'` — the real compose value, matching `docker exec … printenv IDP_LOGIN_URI` |
| `GET /runtime-config.js` | **200** | `application/javascript`, `Cache-Control: no-store` | same body |
| `GET /mentee/api/config` | **401** | `Content-Type: application/json` | `{"error":"Missing or invalid Authorization header"}` — reached `mentee_api` |
| `GET /api/config` | **401** | `Content-Type: application/json` | same JSON — direct-port proxy intact |
| `GET /mentee/assets/index-B2_mCQ8l.js` | **200** | `Cache-Control: public, immutable`, `Expires: Sat, 28 Aug 2027 …`, `Content-Length: 727766` | body starts `const __vite__mapDeps=…` |
| `GET /mentee/assets/index-DPA2ijAz.css` | **200** | `text/css`, `public, immutable` | |
| `GET /mentee/assets/materialdesignicons-webfont-Dp5v-WZN.woff2` | **200** | `font/woff2`, `public, immutable` | fonts are covered by the same rule |
| `GET /assets/index-B2_mCQ8l.js` | **200** | `public, immutable` | root asset regex still works for direct-port debugging |
| `GET /health` | **200** | `Content-Type: text/plain` | `healthy` |

The IdP value was checked **in the body**, not just for a `200`, because of F130's silent-failure finding: the packaged spa_utils inlined its own build-time env, so `VITE_IDP_LOGIN_URI` is inert and a mis-served `runtime-config.js` would fall back to the compiled `http://127.0.0.1:8080/login.html` without any visible error.

### Welcome origin on `:8080` — checked and passing

Developer Edition welcome **was** part of the running stack, so this was verified rather than deferred. `http://localhost:8080/mentee/` returns **this SPA**, not welcome's `index.html`:

| Request | Status | Result |
|---|---|---|
| `GET :8080/mentee/` | **200** | `text/html`, `no-store`, `<title>Mentee</title>`, `/mentee/` asset URLs |
| `GET :8080/mentee/journey` | **200** | `text/html`, `no-store` — history fallback works through welcome |
| `GET :8080/mentee/assets/index-B2_mCQ8l.js` | **200** | `public, immutable`, `Content-Length: 727766` |
| `GET :8080/mentee/runtime-config.js` | **200** | `no-store`, real Tailscale `IDP_LOGIN_URI` in the body |
| `GET :8080/mentee/api/config` | **401** | `application/json` — the browser-origin API path works end to end |
| `GET :8080/` | **200** | welcome's own `<title>Mentor Hub - Welcome</title>`, confirming the two are distinct |

No other repository was touched.

### Cypress is not a gate here

Stated explicitly, as the task requires: **`npm run cypress:run` was not used as a gate in this task.** It was run for information only, and the result is worth passing to F132: **16/16 passing** (`journey.cy.ts` 9, `path.cy.ts` 3, `resource.cy.ts` 4) against the packaged stack, even though every `cy.visit()` is still un-prefixed. The reason is that `createWebHistory('/mentee/')` falls back to the raw pathname when the URL does not start with the base, so an un-prefixed visit still matches the route, and nginx's `location /` history fallback still serves the shell whose assets are all correctly `/mentee/...`. F132 still owns re-pointing the specs — the un-prefixed paths are not the production shape and would not survive the welcome / ALB origin.

### Files changed

**Updated (7) — exactly the task's Outputs, minus the `Dockerfile`:**

- `nginx.conf.template` — added `location ^~ /mentee/api/` (same proxy headers and `${API_HOST}`/`${API_PORT}` as `/api/`), `location = /mentee/runtime-config.js`, `location = /mentee/`, `location /mentee/` (history fallback), `location = /mentee` and `location = /` redirects, and the prefixed asset regex ahead of the root one. `location /api/`, `location /health`, `location = /runtime-config.js`, `location /`, and the root asset regex are unchanged apart from a clarifying comment on `/api/`. One image, one build — no root-only profile.
- `src/api/client.ts` — `apiBase()` replaces `const API_BASE = '/api'`; the one `fetch` call site now uses it. Nothing else in the file changed.
- `src/api/client.test.ts` — `BASE_URL` stub, prefixed assertions, plus derivation / empty-body / error-mapping coverage.
- `src/api/Journey.client.test.ts`, `src/api/Path.client.test.ts`, `src/api/Resource.client.test.ts` — `BASE_URL` stub and prefixed URL assertions.
- `package.json` — `open` now opens `http://localhost:8394/mentee/` (all three fallback forms). No dependency version touched; spa_utils stays pinned at exactly `1.0.0`.
- `README.md` — welcome `:8080/mentee/` named as the supported browser entry with 8394 called out as debug-only; a new **"Container URLs and Proxy Boundaries"** table documenting every nginx location, the Mentee-API-only proxy boundary, and the two load-bearing ordering rules; the flat-docroot note under "Base Path"; the API Client section now describes the base-derived `/mentee/api`; and the Configuration bullet now names `/mentee/api/config`.

**`Dockerfile` NOT changed** — the generated `runtime-config.js` lands in the served root, as evidenced above.

No changes to `vite.config.ts`, `src/router/index.ts`, `src/App.vue`, `cypress.config.ts`, `vitest.config.ts`, `package-lock.json`, `public/**`, `.env.development`, any page, any component, or any Cypress spec.

**Temporary files** — two were created and both were removed: `tmp-base-probe.test.ts` (the `BASE_URL` probe, in the repo root) and `/tmp/f131-nginx-XXXX` (the synthetic docroot for the throwaway nginx). The `f131probe` container was removed with `docker rm -f`. `git status` shows exactly the seven files above plus this task file.

### Environment left as

Full stack up from `npm run service`: `mentorhub-mongodb-1`, `mentorhub-mongodb_api-1`, `mentorhub-mongodb_spa-1`, `mentorhub-mentee_api-1`, `mentorhub-mentee_spa-1`, `mentorhub-welcome-1`. Host **8394** is bound by the `mentee_spa` container only — no dev server was started, so there is no port conflict. The throwaway probe on 18394 is gone.

### Follow-ups and surprises

1. **`Cache-Control` is sent twice on assets** — `max-age=31536000` from `expires 1y` plus `public, immutable` from `add_header`. This is **pre-existing** in the root asset location; the prefixed location mirrors it deliberately so the two blocks stay comparable. HTTP semantics combine repeated headers into one comma-separated list, so the effective policy is `max-age=31536000, public, immutable` — correct, just noisy. Collapsing both blocks into a single `add_header Cache-Control "public, immutable, max-age=31536000"` would be a tidy-up beyond this task's scope. The same duplication exists on `/health`'s `Content-Type`, also pre-existing.
2. **`add_header` inheritance is lost in every child location that declares one.** The server-level `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, and `Access-Control-Allow-Origin` headers do **not** reach responses from `/mentee/`, the asset locations, or either `runtime-config.js` location, because nginx replaces rather than merges `add_header` sets. This is pre-existing behavior (`/health` and `/runtime-config.js` already had it) and the new prefixed locations inherit the same flaw. Fixing it properly needs `always`-qualified duplicates in each location or an `include` snippet — worth a separate task.
3. **`VITE_IDP_LOGIN_URI` is still inert in the packaged spa_utils** — unchanged from F130 follow-up #1. Verifying the *body* of `/mentee/runtime-config.js` rather than just its status code is the mitigation used here, and F132 should keep doing that.
4. **spa_utils logout `return_to` is still base-unaware** — unchanged from the F129/F130 follow-up: `PageFrame.handleLogout()` sends `return_to=${origin}/`, so logging out lands on the welcome root instead of `/mentee/`. Compiled into spa_utils; not worked around here.
5. **`npm run lint` still does not exist.** `npm run build` (`vue-tsc`) remains the type gate.
6. **`npm run open` now opens the prefixed direct-debug URL** (`http://localhost:8394/mentee/`), not the welcome origin. That matches the task's Goal, but note the README states welcome `:8080/mentee/` is the supported entry point — `npm run service` intentionally opens the debug port because that is the container it just started.
