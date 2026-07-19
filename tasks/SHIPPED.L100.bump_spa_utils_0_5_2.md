# L100 – Bump spa_utils to 0.5.2

**Status**: Shipped  
**Type**: Feature  
**Depends On**: none  
**Description**: Bump `@mentor-forge/mentorhub_spa_utils` to **0.5.2** so CardGrid / MhCard / DataCard and type-aligned editors (including EnumEditor / EnumArrayEditor) are available for adoption.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — Cards + type editors section; install from CodeArtifact
- `README.md`
- `package.json` — current dependency is `0.4.1`
- `package-lock.json`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

**External prerequisite**: `mentorhub_spa_utils` **0.5.2** must be published to CodeArtifact. If `npm install` cannot resolve the package, set this task to `Blocked` and stop.

## Goals

- `package.json` depends on `@mentor-forge/mentorhub_spa_utils@0.5.2` (exact or compatible pin matching repo convention).
- CodeArtifact auth is refreshed with `mh` before install.
- Lockfile is updated via `npm install` / `npm ci` so a clean install resolves `0.5.2`.
- Existing app still builds and unit-tests against the new package (no page migrations in this task).
- Legacy exports (`AutoSaveField`, `AutoSaveSelect`, `ListPageSearch`, `useInfiniteScroll`, etc.) remain usable — adoption is additive.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Install**
  - `mh` — refresh CodeArtifact credentials
  - `npm install` (or `npm ci` after lockfile update) — resolves `@mentor-forge/mentorhub_spa_utils@0.5.2`

- **Unit tests**
  - `npm run test`

- **Lint / typecheck / build**
  - `npm run build` — `vue-tsc` + Vite build succeed

- **Packaging verification**
  - `npm run container`

Do **not** require `npm run cypress:run` for this dependency-only task unless install/build regressions appear.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `package.json` — bump `@mentor-forge/mentorhub_spa_utils` to `0.5.2`
- `package-lock.json` — lock resolved `0.5.2`

The agent must not update files outside this list (no page or test migrations here).

## Execution Notes

Plan:
1. Refresh CodeArtifact credentials with `mh`, then install the exact `@mentor-forge/mentorhub_spa_utils@0.5.2` dependency to regenerate the lockfile.
2. Confirm the manifest and lockfile resolve exactly `0.5.2`; make no application or page changes.
3. Run `npm run test`, `npm run build`, and `npm run container`. If CodeArtifact cannot resolve `0.5.2`, mark this task Blocked, document the resolution error, and stop.

Completed:
- `mh` refreshed CodeArtifact credentials successfully.
- `npm install @mentor-forge/mentorhub_spa_utils@0.5.2` resolved the package from CodeArtifact; `npm ci` then completed cleanly (364 packages).
- `npm run test` passed: 7 test files, 44 tests.
- `npm run build` passed (`vue-tsc` and Vite); Vite reported the existing large-chunk warning only.
- `npm run container` passed on retry. The first attempt timed out fetching `node:24-alpine` from Docker Hub; the retry completed successfully. Docker reported pre-existing image-build advisories (three npm audit vulnerabilities and JSON-form CMD guidance) only.
