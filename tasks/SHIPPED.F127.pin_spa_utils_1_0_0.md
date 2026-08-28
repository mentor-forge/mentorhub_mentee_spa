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

- **Plan**: Verified CodeArtifact has `@mentor-forge/mentorhub_spa_utils@1.0.0`. Replaced `"^0.5.7"` with `"1.0.0"` in `package.json`. Updated `package-lock.json` with `npm install --include=dev`. Updated `README.md` to note `1.0.0` pin and updated component list.
- **Infinite scroll grep**: Grep for `useInfiniteScroll`, `InfiniteScroll`, `after_id`, `has_more`, `next_cursor` returned 0 results across `src/`, `cypress/`, and `tests/`.
- **Cypress subpaths**: Verified `cypress/jwtDefaults`, `cypress/registerJwtSignTask`, and `cypress/registerAuthCommands` resolve without issue.
- **Test results**:
  - `npm ls @mentor-forge/mentorhub_spa_utils` -> `1.0.0`
  - `npm run test` -> 10 test files passed, 54 tests passed.
  - `npm run build` -> `vue-tsc && vite build` built cleanly with no errors.
- **Follow-ups**: Noted that this repository has no `npm run lint` script; `npm run build` acts as the type-checking gate.
