# F127 – Pin `@mentor-forge/mentorhub_spa_utils@1.0.0`

**Status**: Shipped  
**Type**: Feature  
**Depends On**: _(none — first task in this wave)_  
**Description**: This repo owns the Mentee SPA **1.0.0 pin** (issue F-ES10). Replace the caret range `^0.5.7` with an exact **`1.0.0`** pin, refresh the lockfile from CodeArtifact, and fix any residual compile or test breakage. Do **not** adopt `PageFrame` (F129), do not change routes or delete pages (F128), and do not touch the `/mentee/` base path (F130–F131).

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — SPA dependency management (exact pins for shared packages)
- `../mentorhub_spa_utils/README.md` — install pin **1.0.0**; **Removed: infinite-scroll list APIs (Removed in 1.0.0)** (`useInfiniteScroll`, `InfiniteScrollResponse`, `InfiniteScrollParams`, `UseInfiniteScrollOptions`; cursor fields `after_id` / `limit` / `has_more` / `next_cursor` must not appear in SPA ↔ API contracts); **Universal PageFrame (1.0.0)**; `AutoSaveSelect` is legacy in favor of `EnumEditor` / `EnumArrayEditor`
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `package.json` / `package-lock.json` — currently `"@mentor-forge/mentorhub_spa_utils": "^0.5.7"` (a **caret range**, not a pin); `npm ls` resolves `0.5.7`
- `cypress.config.ts` — imports `@mentor-forge/mentorhub_spa_utils/cypress/jwtDefaults` and `.../cypress/registerJwtSignTask`
- `cypress/support/e2e.ts` — imports `@mentor-forge/mentorhub_spa_utils/cypress/registerAuthCommands` and calls `registerAuthCommands({ visitPath: '/' })`
- Current spa_utils consumers: `src/App.vue`, `src/router/index.ts`, `src/api/client.ts`, `src/initAuth.ts`, `src/composables/useOffsetList.ts`, `src/composables/useRoles.ts`, `src/pages/AdminPage.vue`, `src/pages/JourneyEditPage.vue`, `src/pages/PathViewPage.vue`, `src/pages/PathsListPage.vue`, `src/pages/ResourceViewPage.vue`, `src/pages/ResourcesListPage.vue`, `src/components/JourneyCompleteDialog.vue`, `src/components/JourneyPathEmbedCard.vue`, `src/components/JourneyProfileHeader.vue`, `src/components/ResourceCardModelSection.vue`, `src/components/ResourceViewCard.vue`, `src/App.test.ts`
- `vitest.config.ts` — inlines `@mentor-forge/mentorhub_spa_utils` in `test.server.deps`

**Source issue**: F-ES10 ("Pin spa_utils 1.0.0, adopt PageFrame, remove list-card pages"). This task delivers **only** the pin.

**External prerequisite**: `@mentor-forge/mentorhub_spa_utils@1.0.0` must be **published to CodeArtifact** (spa_utils F033–F040, PR 29). Run `mh`, then `npm view @mentor-forge/mentorhub_spa_utils version`. If **1.0.0** is not available, set this task **Status** to `Blocked`, rename the file to `BLOCKED.F127.pin_spa_utils_1_0_0.md`, and stop — do not stay on `0.5.7`, do not keep the caret range, and do not point `package.json` at a git URL.

### Wave ordering (why the pin comes first in this repo)

The two source issues are **F-ES09** (Vue `base` + SPA nginx prefix `/mentee/`) and **F-ES10** (pin 1.0.0 + adopt `PageFrame` + remove list pages). This plan runs **pin (F127) → remove list pages (F128) → `PageFrame` (F129) → base path (F130–F131) → Cypress and packaging (F132)**.

This deliberately differs from the sibling Customer SPA, which removed its list pages *before* pinning. The reason that ordering existed does not apply here:

- Nothing in this repo imports `useInfiniteScroll` or any `InfiniteScroll*` type, and no `src/api/**` contract uses `after_id`, `has_more`, or `next_cursor`. Confirm with a grep before starting. This SPA's two list pages use a **local** `src/composables/useOffsetList.ts` built on TanStack `useInfiniteQuery` with offset/size request headers, which 1.0.0 does not touch. The pin is therefore a clean version bump even with the list pages still present.
- Pinning first makes **`buildJourneyUrl`** — a **1.0.0** API — available to F128. F128 needs it twice: for the two "Back to List" actions on the kept detail pages (which now leave for Discovery) and for the router role-gate fallback. Removing pages first would force F128 to write throwaway in-app targets and F129 to re-edit both, which is exactly the rework this ordering avoids.
- `CardGrid`, `MhCard`, `ListPageSearch`, `useErrorHandler`, `provideEditorConfig`, `EnumEditor`, and `EnumArrayEditor` all survive in 1.0.0, so the pages F128 deletes still compile and pass under this pin. The repo stays green at every step.

## Goals

- `package.json` pins `"@mentor-forge/mentorhub_spa_utils": "1.0.0"` — exact semver, **no caret**.
- `package-lock.json` resolves `1.0.0` from the CodeArtifact registry after `mh` and `npm install --include=dev`.
- `npm ls @mentor-forge/mentorhub_spa_utils` reports `1.0.0`.
- A grep for `useInfiniteScroll`, `InfiniteScroll`, `after_id`, `has_more`, and `next_cursor` across `src/`, `cypress/`, and `tests/` returns nothing. Record the result in **Execution Notes** — this is the removal-check for the 1.0.0 pin, and it is expected to already be clean.
- The three spa_utils Cypress subpath imports still resolve under 1.0.0: `cypress/jwtDefaults` (`e2eDefaultJwtSecret`), `cypress/registerJwtSignTask` (`registerJwtSignTask`), and `cypress/registerAuthCommands` (`registerAuthCommands`, with the `visitPath` option). If a subpath or option name moved, update the import here — do **not** vendor a local copy of the JWT sign task or the auth commands.
- Existing behavior is unchanged. `npm run test` and `npm run build` pass with no source edits beyond anything 1.0.0 genuinely breaks:
  - `src/initAuth.ts` IdP bootstrap (`bootstrapAuthFromUrl`, `syncAuthFromStorage`) behaves as today,
  - `src/router/index.ts` guards keep using `useAuth` / `hasStoredRole` / `redirectToIdpLogin`, with the `/` → `/journey` redirect and the `next({ name: 'Journey' })` role-gate fallback untouched,
  - `src/App.vue` keeps its local `v-app-bar` / `v-navigation-drawer` / `handleLogout` chrome, the `useAppTitle` dynamic title, the `getMyJourney` query, and the existing `provideEditorConfig(config)` call,
  - `src/composables/useOffsetList.ts` and both list pages still render.
- `README.md` names the pinned version **1.0.0**, and its "Reusable Components and Composables" section stops advertising removed infinite-scroll helpers. Do not describe `PageFrame` adoption here — F129 owns that copy.
- Do **not** wrap `PageFrame`, do **not** delete any page or route, and do **not** change `vite.config.ts`, `nginx.conf.template`, `Dockerfile`, `src/router/index.ts`, or `src/api/client.ts`.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `mh` (CodeArtifact auth) then `npm install --include=dev`
- `npm ls @mentor-forge/mentorhub_spa_utils` — confirm `1.0.0`
- `npm run test` — full Vitest suite, including `src/App.test.ts` and the `src/api/**` / `src/composables/**` / `src/components/**` coverage thresholds in `vitest.config.ts`
- `npm run build` — `vue-tsc` must be clean. **This repo defines no `lint` script**, so `npm run build` is the type gate. Do not add a lint script in this task; record the missing `npm run lint` from the issue acceptance criteria as a follow-up in Execution Notes.
- `npm run api` then `npm run dev` — smoke check at `http://localhost:8394/`: login round-trips through the IdP, `/` redirects to `/journey` and the journey detail card renders, the app-bar title shows `{full_name}:Mentee`, and the local drawer still opens

**Packaging verification:**

- `npm run container` — build the SPA container image
- `npm run service` — run db + API + SPA containers
- `npm run cypress:run` — headless end-to-end tests (long running); every existing spec must still pass at the un-prefixed origin

Do not run `npm run dev` and `npm run service` at the same time — both bind host port **8394**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `package.json` — exact `1.0.0` pin replacing `^0.5.7`
- `package-lock.json` — resolved `1.0.0` from CodeArtifact
- `README.md` — spa_utils version note and component list
- `cypress.config.ts`, `cypress/support/e2e.ts` — only if a spa_utils Cypress subpath or option moved in 1.0.0
- Any `src/**` file that fails to compile or test against `1.0.0`

Do not change `src/App.vue` chrome, `src/router/index.ts`, `vite.config.ts`, `nginx.conf.template`, `Dockerfile`, `vitest.config.ts`, or `src/api/client.ts` in this task.

## Execution Notes

### Plan

1. Confirm the external prerequisite (`mh`, then `npm view` reports `1.0.0`).
2. Run the removal-check grep **before** touching anything, to confirm the pin is a clean bump.
3. Replace `"^0.5.7"` with `"1.0.0"` in `package.json`, then `npm install --include=dev` to refresh `package-lock.json` from CodeArtifact.
4. Verify the three spa_utils Cypress subpaths and the `visitPath` option still exist in the 1.0.0 artifact before deciding whether `cypress.config.ts` / `cypress/support/e2e.ts` need edits.
5. Run `npm run test` and `npm run build` (the type gate); fix only genuine 1.0.0 breakage.
6. Update `README.md` for the pinned version and the removed infinite-scroll helpers.
7. Packaging verification: `npm run container`, `npm run service`, `npm run cypress:run`; then the dev-server smoke check separately (never concurrent with `npm run service` — both bind host port 8394).

### Commands run

```sh
mh && npm view @mentor-forge/mentorhub_spa_utils version   # -> 1.0.0
rg -n "useInfiniteScroll|InfiniteScroll|after_id|has_more|next_cursor" src/ cypress/ tests/
npm install --include=dev
npm ls @mentor-forge/mentorhub_spa_utils                    # -> 1.0.0
npm run test
npm run test:coverage
npm run build
npm run container
npm run service
npx cypress install && npx cypress verify
npm run cypress:run
npm run api                                                 # frees 8394 for the dev check
npx vite                                                    # backgrounded, curled, killed
mh up mentee                                                # stack restored
npm run lint                                                # -> Missing script: "lint"
```

### Results

**Pin.** `package.json` now carries the exact pin `"@mentor-forge/mentorhub_spa_utils": "1.0.0"` (no caret). `package-lock.json` resolves `1.0.0` from the CodeArtifact registry
(`.../mentorhub_spa_utils-1.0.0.tgz`, integrity `sha512-oxrDdKmiNmVRKfDGfWQX9rGn+umXe9uElnD+DfS4kNvFv6RPPAl6Vfx849alIgYgGl8amjdowMvLFdbr8H7kMQ==`).
`npm ls @mentor-forge/mentorhub_spa_utils` reports `1.0.0`, and the on-disk `node_modules` copy reports `1.0.0`.

**Removal-check grep.** `rg -n "useInfiniteScroll|InfiniteScroll|after_id|has_more|next_cursor" src/ cypress/ tests/` → **no matches** (exit 1). Clean, exactly as the task anticipated. The two list pages continue to use the local `src/composables/useOffsetList.ts` (TanStack `useInfiniteQuery` over offset/size request headers), which 1.0.0 does not touch.

**Cypress subpath verification.** All three subpaths survive unchanged in the 1.0.0 `exports` map, so **no edits were needed** to `cypress.config.ts` or `cypress/support/e2e.ts`:

| Import | 1.0.0 `exports` target | Symbol verified |
|--------|------------------------|-----------------|
| `.../cypress/jwtDefaults` | `./cypress/config/jwtDefaults.ts` | `e2eDefaultJwtSecret()` |
| `.../cypress/registerJwtSignTask` | `./cypress/plugins/registerJwtSignTask.ts` | `registerJwtSignTask(on)` |
| `.../cypress/registerAuthCommands` | `./cypress/support/registerAuthCommands.ts` | `registerAuthCommands(options)`, `RegisterAuthCommandsOptions.visitPath?: string` (defaults to `'/'`) |

**`npm run test`** — **PASS**: 10 test files, **54 tests passed, 0 failed**. No source edits were required; 1.0.0 broke nothing in this repo.

**`npm run build`** — **PASS**: `vue-tsc` clean (zero TS errors), `vite build` succeeded, 656 modules transformed. The only output is the pre-existing >500 kB chunk-size advisory. This is the type gate for the repo.

**`npm run container`** — **PASS**: image `ghcr.io/mentor-forge/mentorhub_mentee_spa:latest` built (multi-stage build installed `1.0.0` from CodeArtifact via the build secret).

**`npm run service`** — **PASS**: mongodb, mongodb_api, mongodb_spa, mentee_api, mentee_spa, and welcome all started. The SPA answered `200` at `http://localhost:8394/`, `/runtime-config.js` was injected correctly with `IDP_LOGIN_URI`, and the nginx `/api/` proxy answered `401` unauthenticated (expected).

**`npm run cypress:run`** — **PASS**: **39 of 39 tests passed across all 4 specs**, at the un-prefixed origin.

| Spec | Tests | Passing |
|------|-------|---------|
| `journey.cy.ts` | 10 | 10 |
| `navigation.cy.ts` | 7 | 7 |
| `path.cy.ts` | 9 | 9 |
| `resource.cy.ts` | 13 | 13 |

**Dev-server smoke check** — partially verified, non-interactively. Run after `npm run api` (never alongside `npm run service`). Vite started clean and served `/` → `200`, transformed `/src/main.ts` and `/src/App.vue` → `200`, and resolved the re-optimized `@mentor-forge_mentorhub_spa_utils.js` prebundle → `200` with no Vite errors. Vite logged `Re-optimizing dependencies because lockfile has changed`, confirming it picked up the new pin. Note that the dev server binds **IPv6 loopback only** (`[::1]:8394`), so `curl 127.0.0.1:8394` fails while `curl "http://[::1]:8394/"` succeeds — a probing gotcha, not a defect. The *interactive* half of the smoke check (live IdP login round-trip, `{full_name}:Mentee` app-bar title, drawer open) was not driven by hand in this automated run; the equivalent paths are covered by `navigation.cy.ts`, which passed.

### Files changed

- `package.json` — exact `1.0.0` pin replacing `^0.5.7`
- `package-lock.json` — resolved `1.0.0` from CodeArtifact
- `README.md` — names the exact `1.0.0` pin; refreshed the "Reusable Components and Composables" list to match what this SPA actually imports (cards + type-aligned editors), noted `AutoSaveField` / `AutoSaveSelect` as legacy, and stated explicitly that the infinite-scroll APIs were removed in 1.0.0 and that list pages use the local `useOffsetList`

No `src/**`, `cypress/**`, `vite.config.ts`, `nginx.conf.template`, `Dockerfile`, `vitest.config.ts`, `src/api/client.ts`, or `src/router/index.ts` changes were needed or made. No `PageFrame` adoption, no route or page deletions, no base-path work.

### Follow-ups

1. **Missing `npm run lint` (required by the F-ES10 acceptance criteria).** Confirmed absent — `npm run lint` fails with `Missing script: "lint"`. Per this task's instructions no lint script was added here; `npm run build` (`vue-tsc`) is the current type gate. The SPA standards list `npm run lint` as a standard developer command, so a follow-up task should add ESLint + Prettier (or equivalent) and wire the script.

2. **Coverage thresholds in `vitest.config.ts` fail — pre-existing, not caused by the pin.** `npm run test` is `vitest run` *without* coverage, so it passes and does not exercise the thresholds. Running `npm run test:coverage` fails them:
   - `src/composables/**`: 61.02% lines / 58.33% branches / 84.61% functions (thresholds 90 / 60 / 90)
   - `src/components/**`: 0% lines and statements (threshold 90)

   **Verified pre-existing by direct comparison:** I stashed the pin, reinstalled `0.5.7`, and re-ran `npm run test:coverage` — the failing percentages were **byte-identical** on both versions, then restored the pin. The cause is structural: the repo has no component test files at all (`src/components/*.vue` are all 0%), `src/composables/useOffsetList.ts` and `useAuth.ts` are untested, and the coverage `exclude` list does not exclude `cypress/**`, so E2E specs are counted at 0%. Worth its own task; out of scope for the pin.

3. Note for downstream tasks: **`buildJourneyUrl` is exported from the package root** in 1.0.0 with signature `buildJourneyUrl(journey: JourneyPrefix, path?: string): string`, where `JourneyPrefix` is `'discovery' | 'customer' | 'admin' | 'mentor' | 'mentee'`. `resolveAlbOrigin(location?)` and the `JOURNEY_APP_PATHS` catalog are exported alongside it. F128 depends on this.
