# L126 – Manual approval: mentee SPA on CodeArtifact 0.5.7

Status: Shipped
Type: Feature
Depends On: L125
Description: Human checkpoint — Mike repeats dev-server and container IdP redirect tests after mentee_spa uses published spa_utils 0.5.7, then merges the mentee_spa PR.

## Context

- `tasks/SHIPPED.L125.adopt_spa_utils_0_5_7_codeartifact.md`
- `../mentorhub/tasks/SHIPPED.S45.manual_approval_container_idp_redirect.md`

## Goals

- Mike manually confirms:
  - **`npm run dev`** — redirect to `127.0.0.1:8080/login.html` on localhost dev.
  - **Container + `mh up`** — redirect to `http://<HOST_NAME>:8080/login.html` over MagicDNS.
  - Logout redirect behaves correctly in both modes.
- Mike merges the mentee_spa PR.
- Record approval in **Execution Notes**; rename to `SHIPPED.L126...` when complete so mentor_spa R146 can proceed.

## Testing Expectations

- Manual verification only.

## Outputs

- This task file — **Execution Notes** only.

## Execution Notes

**Approval**

- **Tester:** Mike Storey
- **Date:** 2026-07-31
- **HOST_NAME:** `m5max.tailb0d293.ts.net`

**Manual test results**

1. **`npm run dev`** — unauthenticated redirect to `http://127.0.0.1:8080/login.html`; logout redirect same host. **Pass**
2. **Container + `mh up mentee`** — unauthenticated redirect to `http://m5max.tailb0d293.ts.net:8080/login.html` (not `127.0.0.1`); sign-in and logout use same MagicDNS IdP host. **Pass**
3. CodeArtifact `@mentor-forge/mentorhub_spa_utils@0.5.7` build verified end-to-end.

**Outcome:** **Approved.** PR https://github.com/mentor-forge/mentorhub_mentee_spa/pull/27 ready to merge. **R146** may proceed.

**Branch:** `F-W08-bump-spa-utils-0.5.6`
