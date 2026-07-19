# L109 – Bump spa_utils to 0.5.3

**Status**: Pending  
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

_Reserved for the task execution agent._
