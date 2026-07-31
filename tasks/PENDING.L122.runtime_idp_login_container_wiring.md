# L122 – Wire runtime `IDP_LOGIN_URI` in mentee SPA container

Status: Pending
Type: Defect
Depends On: none
Description: Temporarily depend on local `../mentorhub_spa_utils` (F029) and inject container `IDP_LOGIN_URI` at nginx startup so unauthenticated redirects honor `mh` / MagicDNS hosts — same image in every environment (issue F-W08).

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub/DeveloperEdition/standards/sre_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `Dockerfile`
- `nginx.conf.template`
- `index.html`
- `src/vite-env.d.ts`
- `package.json`
- `../mentorhub/tasks/SHIPPED.S41.idp_login_uri_magic_hostname.md`

**External prerequisites:**

- `mentorhub_spa_utils` **F029** implemented on branch **`0.5.8-IDP-Login`** (sibling `../mentorhub_spa_utils`).
- mentorhub **S44** shipped (compose passes `IDP_LOGIN_URI`; `make update` run).

## Goals

- Point `@mentor-forge/mentorhub_spa_utils` at **`file:../mentorhub_spa_utils`** in `package.json` (temporary — reverted in L125). Run `npm install` to refresh lockfile.
- At container startup, generate a small runtime config script from the **`IDP_LOGIN_URI`** env var (envsubst or equivalent in Dockerfile `CMD`, matching the existing `API_HOST` / `API_PORT` pattern).
- Load that script from `index.html` **before** the app bundle so spa_utils F029 can read runtime `IDP_LOGIN_URI`.
- Extend Dockerfile `ENV` / `envsubst` to include `IDP_LOGIN_URI` (default `http://127.0.0.1:8080/login.html`).
- **Minimal SPA code changes** — prefer Dockerfile + nginx/index.html only; update `vite-env.d.ts` only if TypeScript needs the runtime global.
- Do **not** change router guards, `initAuth.ts`, or Cypress unless required for the injection hook.
- `.env.development` keeps `VITE_IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` for `npm run dev`.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm install` — local spa_utils link
- `npm run test`
- `npm run build`
- `npm run container` — image builds with runtime config generation

**Integration test (also covered in L123):**

```bash
cd ~/source/mentor-forge/mentorhub_mentee_spa && mh down && npm run container
cd ~/source/mentor-forge/mentorhub && make update && mh up mentee
```

With `~/.mentorhub/HOST_NAME` set, unauthenticated access to the mentee SPA should redirect to `http://<HOST_NAME>:8080/login.html`.

## Outputs

- `package.json` — temporary `file:../mentorhub_spa_utils` dependency
- `package-lock.json`
- `Dockerfile` — `IDP_LOGIN_URI` env + startup script generation
- `nginx.conf.template` — only if needed to serve runtime config
- `index.html` — load runtime config before app bundle
- `public/runtime-config.js.template` — **or** equivalent single-file approach documented in Execution Notes
- `src/vite-env.d.ts` — runtime global typing (if needed)

The agent must not update files outside this list.

## Execution Notes

**Branch:** Continue on the existing F-W08 branch in this repo.

