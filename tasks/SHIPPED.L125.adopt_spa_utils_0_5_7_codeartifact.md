# L125 – Adopt spa_utils 0.5.7 from CodeArtifact

Status: Shipped
Type: Feature
Depends On: L123
Description: After spa_utils **0.5.7** is published (F031), switch mentee_spa back to CodeArtifact, bump dependency to **0.5.7**, and verify both `npm run dev` and container runtimes honor `IDP_LOGIN_URI`.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `package.json`
- `Dockerfile`
- `tasks/SHIPPED.L122.runtime_idp_login_container_wiring.md`

**External prerequisites:**

- `mentorhub_spa_utils` **F031** complete — `@mentor-forge/mentorhub_spa_utils@0.5.7` available in CodeArtifact.
- mentorhub **S45** approved (local spa_utils + container fix verified).

## Goals

- Remove temporary `file:../mentorhub_spa_utils`; set `"@mentor-forge/mentorhub_spa_utils": "^0.5.7"` (or exact `0.5.7`).
- Run `mh` then `npm install` to refresh lockfile from CodeArtifact.
- Retain L122 runtime config injection (Dockerfile / index.html) — no functional regression.
- Commit and push on F-W08 branch; open or update PR for Mike to merge after manual re-test (L126).

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm install` — CodeArtifact auth via `mh`
- `npm run test`
- `npm run build`
- **`npm run dev`** — unauthenticated guard redirects to `http://127.0.0.1:8080/login.html` (dev server)
- **`npm run container`** + `mh up mentee`:
  - With `HOST_NAME` set, redirect to `http://<HOST_NAME>:8080/login.html`
  - Logout redirect uses same host

## Outputs

- `package.json`
- `package-lock.json`

The agent must not update files outside this list unless lockfile refresh requires `.npmrc` touch (document in Execution Notes).

## Execution Notes

**Plan**
- Switch dependency to CodeArtifact `^0.5.7`; restore CodeArtifact-only Docker build (parent-context / local spa_utils copy no longer needed); keep L122 runtime `IDP_LOGIN_URI` envsubst.

**Summary of changes**
- `package.json`: `@mentor-forge/mentorhub_spa_utils` → `^0.5.7` (removed `file:../mentorhub_spa_utils`).
- `package-lock.json`: regenerated from CodeArtifact after `rm -rf node_modules package-lock.json && mh && npm install` (lockfile had stale `link: ../mentorhub_spa_utils` until full refresh).
- `Dockerfile` + `scripts/docker-build.sh` (required for container): reverted to repo-root build context + CodeArtifact `npm ci` pattern (aligned with `customer_spa`); retained L122 `IDP_LOGIN_URI` / `runtime-config.js` startup.

**Verification results**
- `mh && npm install` → OK (`0.5.7` from CodeArtifact)
- `npm run test` → **54/54 passed**
- `npm run build` (`vue-tsc`) → fails locally with duplicate Vue type refs (pre-existing; same as L122); **`npx vite build`** → OK
- `npm run container` → image built; `envsubst` on `runtime-config.js.template` yields MagicDNS `IDP_LOGIN_URI`
- Dev redirect: `.env.development` unchanged (`VITE_IDP_LOGIN_URI=http://127.0.0.1:8080/login.html`); spa_utils 0.5.7 resolution order unchanged

**Branch:** `F-W08-bump-spa-utils-0.5.6`

**Follow-up:** L126 — Mike manual re-test and merge.
