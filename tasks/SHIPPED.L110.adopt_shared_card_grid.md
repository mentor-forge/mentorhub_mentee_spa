# L110 – Adopt shared CardGrid; remove local ResponsiveCardGrid

**Status**: Shipped
**Type**: Feature  
**Depends On**: L109_bump_spa_utils_0_5_3  
**Description**: Replace the PathsListPage local `ResponsiveCardGrid` with package `CardGrid` from spa_utils **0.5.4**, delete the prototype, drop removed breakpoint props on view pages, and confirm path and resource cards display correctly under the new shared grid.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — CardGrid contract (equal-width/height expanded, 1→8 columns, `.mh-card-grid` / `.mh-card-grid__item`, no `cols`/`sm`/`md`/`lg`/`xl`; component CSS via package-root import in `0.5.4`)
- `../mentorhub_spa_utils/src/components/CardGrid.vue`
- `README.md`
- `src/pages/PathsListPage.vue` — local `ResponsiveCardGrid`
- `src/pages/ResourcesListPage.vue` — already uses package `CardGrid`
- `src/pages/PathViewPage.vue` — still passes `cols` / `md` to `CardGrid`
- `src/pages/ResourceViewPage.vue` — still passes `cols` / `md` to `CardGrid`
- `src/components/ResponsiveCardGrid.vue`
- `src/components/ResponsiveCardGrid.test.ts`
- `cypress/e2e/path.cy.ts` — asserts `.responsive-card-grid__item` and equal-height / column progression
- `cypress/e2e/resource.cy.ts` — card list / search / load-more
- `tasks/ISSUE.mentorhub_spa_utils.harvest_responsive_card_grid.md` — downstream migration steps
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

## Goals

- `PathsListPage` imports package-root `CardGrid` from `@mentor-forge/mentorhub_spa_utils` and no longer imports local `ResponsiveCardGrid`.
- Paths presentation stays as refined in L107: `path.name` as full card title, description-only body, no status chip, fluid container so the grid can grow toward eight columns, existing automation IDs unchanged.
- Delete local prototype files:
  - `src/components/ResponsiveCardGrid.vue`
  - `src/components/ResponsiveCardGrid.test.ts`
- Remove obsolete `CardGrid` breakpoint props (`cols`, `md`, etc.) from `PathViewPage` and `ResourceViewPage` (and any other in-repo `CardGrid` usages) so the build matches the shared CardGrid API.
- Confirm **both** Paths and Resources list cards render correctly with shared `CardGrid`: equal-width columns, equal-height expanded cards within a row, responsive growth through a maximum of eight columns on a fluid/wide page, stable automation IDs, search/load-more/view navigation unchanged.
- Update Cypress path specs to assert `.mh-card-grid__item` (or the current package class names) instead of `.responsive-card-grid__item`; keep equal-height and 1→8 column progression coverage.
- Do not change resource search behavior in this task (L111).

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Unit tests**
  - `npm run test` — local `ResponsiveCardGrid` tests are gone; remaining suite passes

- **Build**
  - `npm run build` — no TypeScript errors from removed CardGrid breakpoint props

- **E2E (required — grid selectors and layout contract)**
  - `npm run api` / `npm run service` as needed
  - Update `cypress/e2e/path.cy.ts` for shared grid item class names; retain equal width/height and column progression assertions
  - Confirm `cypress/e2e/resource.cy.ts` still passes against shared `CardGrid` on Resources
  - `npm run cypress:run` — path and resource specs pass (full suite preferred)

- **Packaging verification**
  - `npm run container`
  - `npm run service`
  - `npm run cypress:run`

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/pages/PathsListPage.vue` — package `CardGrid` instead of local `ResponsiveCardGrid`
- `src/pages/PathViewPage.vue` — remove removed `CardGrid` breakpoint props
- `src/pages/ResourceViewPage.vue` — remove removed `CardGrid` breakpoint props
- `cypress/e2e/path.cy.ts` — shared grid class / layout assertions
- `cypress/e2e/resource.cy.ts` — only if selectors or layout assertions need adjustment
- `vitest.config.ts` — inline `@mentor-forge/mentorhub_spa_utils` so Vitest can process the package-root CSS side-effect import from `0.5.4`

**Delete:**

- `src/components/ResponsiveCardGrid.vue`
- `src/components/ResponsiveCardGrid.test.ts`

The agent must not rewrite resource search, API clients, or Resource field coverage in this task.

## Execution Notes

### Plan
1. Replace the local Paths grid with package `CardGrid`, preserving the L107 markup and automation IDs.
2. Remove obsolete breakpoint props from the two view-page grids, update the Paths Cypress class selector, and delete the local prototype plus its tests.
3. With spa_utils `0.5.4`, confirm CardGrid CSS loads in the app; inline the package in Vitest so unit tests accept the CSS side-effect import.
4. Run unit, build, packaging/service, and Cypress verification; record results and ship.

### Shipped
- Replaced `ResponsiveCardGrid` with package-root `CardGrid` on Paths; preserved fluid container, title/body presentation, no status chip, and automation IDs.
- Removed `cols` / `md` from Path and Resource view grids; deleted local grid + unit test; updated Paths Cypress for `.mh-card-grid__item`.
- Unblocked by `@mentor-forge/mentorhub_spa_utils@0.5.4` (package-root CSS side-effect import).
- Added Vitest `server.deps.inline` for `@mentor-forge/mentorhub_spa_utils` so unit tests process `dist/index.css`.

### Verification
- `npm run test` — passed (8 files, 42 tests).
- `npm run build` — passed.
- `npm run container` — passed.
- `npm run service` — passed.
- `npm run cypress:run` — passed (21 tests): path equal-height and 1→8/8-cap cases; resource card flows.
