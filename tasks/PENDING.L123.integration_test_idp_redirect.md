# L123 – Integration test IdP redirect in mentee SPA container

Status: Pending
Type: Feature
Depends On: L122
Description: Build mentee SPA container with local spa_utils, bring up Developer Edition stack, and verify unauthenticated and logout redirects use `http://<HOST_NAME>:8080/login.html` (not `127.0.0.1`) when `~/.mentorhub/HOST_NAME` is configured.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `README.md`
- `tasks/PENDING.L122.runtime_idp_login_container_wiring.md`
- `../mentorhub/CONTRIBUTING.md` — VPN / `HOST_NAME` setup
- `../mentorhub/tasks/BLOCKED.S45.manual_approval_container_idp_redirect.md`

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

- `tasks/PENDING.L123.integration_test_idp_redirect.md` — **Execution Notes** with test log
- `cypress/e2e/navigation.cy.ts` — **only if** a reliable automated redirect assertion is added

The agent must not update files outside this list unless a minimal Cypress fix is required.

## Execution Notes

After automated checks pass, notify Mike that **S45 manual approval** is ready.

