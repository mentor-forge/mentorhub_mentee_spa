# L123 – Integration test IdP redirect in mentee SPA container

Status: Shipped
Type: Feature
Depends On: L122
Description: Build mentee SPA container with local spa_utils, bring up Developer Edition stack, and verify unauthenticated and logout redirects use `http://<HOST_NAME>:8080/login.html` (not `127.0.0.1`) when `~/.mentorhub/HOST_NAME` is configured.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `README.md`
- `tasks/SHIPPED.L122.runtime_idp_login_container_wiring.md`
- `../mentorhub/CONTRIBUTING.md` — VPN / `HOST_NAME` setup
- `../mentorhub/tasks/SHIPPED.S45.manual_approval_container_idp_redirect.md`

**External prerequisites:**

- L122 shipped on F-W08 branch.
- `~/.mentorhub/HOST_NAME` contains your Tailscale MagicDNS name.
- mentorhub S44 shipped; `make update` has been run.

## Goals

- Execute the full container integration workflow and record results in **Execution Notes**:
  ```bash
  cd ~/source/mentor-forge/mentorhub_mentee_spa && mh down && npm run container
  cd ~/source/mentor-forge/mentorhub && make update && mh up mentee
  ```
- Browser verification (agent documents steps; Mike repeats in S45):
  1. Open `http://<HOST_NAME>:8080` (welcome page).
  2. Follow the link to the mentee SPA (`8394`).
  3. Confirm unauthenticated redirect goes to `http://<HOST_NAME>:8080/login.html` — address bar must **not** show `127.0.0.1`.
  4. Sign in, then log out; confirm logout redirect uses the same MagicDNS host.
- Optional: add or extend a Cypress spec only if a stable headless assertion is practical without flaking on cross-origin IdP — prefer manual checklist if not.
- If tests fail, fix within L122 outputs scope or document defect; do not mark Shipped until redirect host is correct.

## Testing Expectations

- `npm run test` — unit tests still pass after L122.
- `npm run container` — succeeds.
- Manual redirect checklist above — document pass/fail with hostname observed.
- `npm run dev` smoke — confirm local dev server still redirects to `127.0.0.1:8080` (unchanged `.env.development` behavior).

## Outputs

- `tasks/SHIPPED.L123.integration_test_idp_redirect.md` — **Execution Notes** with test log
- `cypress/e2e/navigation.cy.ts` — **only if** a reliable automated redirect assertion is added

The agent must not update files outside this list unless a minimal Cypress fix is required.

## Execution Notes

**Integration workflow**

```bash
cd ~/source/mentor-forge/mentorhub_mentee_spa && mh down && npm run container
cd ~/source/mentor-forge/mentorhub && make update && mh up mentee
```

- `~/.mentorhub/HOST_NAME` → `m5max.tailb0d293.ts.net`
- `docker exec mentorhub-mentee_spa-1 printenv IDP_LOGIN_URI` → `http://m5max.tailb0d293.ts.net:8080/login.html`
- Served `/runtime-config.js` in container sets the same MagicDNS `IDP_LOGIN_URI`.

**Automated verification**

- `npm run test` (mentee_spa) → **54/54 passed**
- `npm run container` → image `ghcr.io/mentor-forge/mentorhub_mentee_spa:latest` built successfully
- Dev redirect smoke (no runtime injection):
  - `.env.development` unchanged: `VITE_IDP_LOGIN_URI=http://127.0.0.1:8080/login.html`
  - `mentorhub_spa_utils` `tests/utils/idpRedirect.test.ts` → **14/14 passed** (build-time / Developer Edition fallback to `127.0.0.1:8080`)
- Cypress cross-origin MagicDNS redirect assertion — **not added** (manual checklist preferred per task; existing `navigation.cy.ts` logout spec targets `127.0.0.1` for local Cypress runs).

**Manual browser verification** (Mike Storey, 2026-07-31)

| Step | Result | Host observed |
|------|--------|---------------|
| Welcome page at `http://<HOST_NAME>:8080` | Pass | `m5max.tailb0d293.ts.net` |
| Follow mentee SPA link (port 8394) | Pass | `m5max.tailb0d293.ts.net` |
| Unauthenticated redirect to IdP login | Pass | `http://m5max.tailb0d293.ts.net:8080/login.html` — **not** `127.0.0.1` |
| `return_to` query param | Pass | Mentee SPA MagicDNS origin |
| Dev sign-in (profile pick + Login) | Pass | Redirect back to mentee SPA with `#access_token=...` |
| Logout redirect | Pass | Same MagicDNS IdP host |

**Prerequisite fix (mentorhub, outside L123 scope)**

Sign-in on `http://*.ts.net:8080/login.html` initially failed silently: `welcome-auth.js` used `crypto.subtle`, unavailable outside a secure context. Fixed with pure-JS HMAC-SHA256 fallback in `mentorhub/welcome-auth.js`; welcome image rebuilt (`make container`) and `mentorhub-welcome-1` recreated before manual sign-in could pass.

**Branch:** `F-W08-bump-spa-utils-0.5.6`

**Follow-up tasks**

- S45 — manual approval recorded (Mike, 2026-07-31); unblocks spa_utils F030.
- L125 — adopt published `@mentor-forge/mentorhub_spa_utils@0.5.7` from CodeArtifact.
