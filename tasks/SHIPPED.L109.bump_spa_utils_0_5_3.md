# L109 – Bump spa_utils to 0.5.3

**Status**: Shipped  
**Type**: Feature  
**Depends On**: none  
**Description**: Bump `@mentor-forge/mentorhub_spa_utils` to **0.5.3** so the harvested equal-height responsive `CardGrid` (CSS Grid 1→8) is available for Paths and Resources list adoption.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — CardGrid migration notes for `0.5.3` (fixed CSS Grid; former `cols`/`sm`/`md`/`lg`/`xl` props removed)
- `README.md`
- `package.json` — current dependency is `0.5.2`
- `package-lock.json`
- `tasks/ISSUE.mentorhub_spa_utils.harvest_responsive_card_grid.md` — downstream migration outline
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

**External prerequisite**: `mentorhub_spa_utils` **0.5.3** must be published to CodeArtifact. If `npm install` cannot resolve the package, set this task to `Blocked` and stop.

## Goals

- `package.json` depends on `@mentor-forge/mentorhub_spa_utils@0.5.3` (exact pin matching repo convention).
- CodeArtifact auth is refreshed with `mh` before install.
- Lockfile is updated via `npm install` / `npm ci` so a clean install resolves `0.5.3`.
- Existing app still builds and unit-tests against the new package (no page migrations in this task).
- Do **not** remove `ResponsiveCardGrid` or change list/view pages here — that is L110.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Install**
  - `mh` — refresh CodeArtifact credentials
  - `npm install` (or `npm ci` after lockfile update) — resolves `@mentor-forge/mentorhub_spa_utils@0.5.3`

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

- `package.json` — bump `@mentor-forge/mentorhub_spa_utils` to `0.5.3`
- `package-lock.json` — lock resolved `0.5.3`

The agent must not update files outside this list (no page or test migrations here).

## Execution Notes

### Plan

1. Refresh CodeArtifact credentials with `mh`, then update the exact shared-package pin and regenerate the lockfile through npm.
2. Verify the clean dependency resolution and run the required unit, build, and container checks.
3. Record the results, mark the task shipped, and rename this task file only if every required check succeeds.

### Shipped

- Updated `@mentor-forge/mentorhub_spa_utils` to the exact `0.5.3` release in `package.json` and `package-lock.json`; CodeArtifact resolved the package successfully.
- `mh` — passed (CodeArtifact credentials refreshed).
- `npm install @mentor-forge/mentorhub_spa_utils@0.5.3 --save-exact` — passed.
- `npm ci` — passed (clean install resolved `0.5.3`).
- `npm run test` — passed (9 files, 50 tests).
- `npm run build` — passed.
- `npm run container` — passed.
