# L107 – Refine the Paths card layout

**Status**: Shipped
**Type**: Feature  
**Depends On**: L106_prototype_equal_height_card_grid  
**Description**: Apply the local responsive grid prototype to Paths and simplify each card to the path name and description.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — `MhCard` contract and stable automation guidance
- `../mentorhub_spa_utils/src/components/MhCard.vue`
- `README.md`
- `src/components/ResponsiveCardGrid.vue`
- `src/pages/PathsListPage.vue`
- `cypress/e2e/path.cy.ts`
- `tasks/PENDING.L106.prototype_equal_height_card_grid.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

## Goals

- Replace the shared `CardGrid` usage on `PathsListPage` with the tested local `ResponsiveCardGrid` prototype; continue using shared `MhCard`.
- Allow the page content area to use the available wide-screen width so the grid can progress beyond four columns and display up to eight equal-width columns.
- Render `path.name` as the complete card header. Remove the literal `Path` header prefix and do not pass the name as a secondary header value.
- Render only `path.description` in the card body.
- Remove the status chip and its status automation element. Do not replace it with other status text; the list API normally returns only active paths for non-privileged users.
- Keep existing search, loading, error, pagination/load-more, view action, routing, and their stable automation IDs unchanged.
- Do not change Resources or other card pages in this experiment.
- Exercise cards with different description lengths and verify that cards on the same visual row have equal heights while cards retain equal widths.
- Verify responsive layouts at representative narrow, desktop, and wide-screen viewports, including a viewport that produces eight columns and never more than eight.

## Testing Expectations

Run all commands from **this SPA repository root**.

- Update `cypress/e2e/path.cy.ts` fixtures to include varied path-name and description lengths.
- Update or add Cypress assertions that:
  - each card header contains its `path.name` without a separate `Path` prefix;
  - each card body contains the description and no status chip/status automation element;
  - cards in the same row have equal computed widths and equal rendered heights despite varied content;
  - responsive column counts progress beyond four and reach, but do not exceed, eight at the documented wide-screen viewport;
  - search, load-more, and navigation continue to work.
- `npm run test`
- `npm run build`
- `npm run lint` if the script exists; otherwise record that it is unavailable.
- Packaging verification:
  - `npm run container`
  - `npm run service`
  - `npm run cypress:run`

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/pages/PathsListPage.vue` — consume the local responsive grid and simplify Path card content
- `cypress/e2e/path.cy.ts` — verify card content, equal sizing, responsive column counts, and retained interactions

The agent must not edit `mentorhub_spa_utils`, `src/pages/ResourcesListPage.vue`, shared `MhCard`, API filtering, API clients, or API repositories in this task.

## Execution Notes

### Plan
1. Update `PathsListPage.vue`: swap shared `CardGrid` for local `ResponsiveCardGrid`; keep `MhCard` + view action; set card `title` to `path.name` only (drop literal `"Path"` and `:name`); body = description only (remove status chip/automation); use `fluid` on `v-container` so the grid can grow past 4 columns toward 8.
2. Update `cypress/e2e/path.cy.ts`: fixtures with varied name/description lengths; assert header = name (no `Path` prefix), body = description, no status automation; equal width/height within a row; column counts progress past 4 and reach (not exceed) 8 at 2560px; retain search/load-more/view navigation.
3. Run `npm run test`, `npm run build`, note lint unavailable, then packaging (`container`, `service`, `cypress:run`).

### What shipped
- `PathsListPage.vue` now uses local `ResponsiveCardGrid` (not shared `CardGrid`), `v-container fluid` for wide layouts, `MhCard` title = `path.name` only, body = description only (status chip removed). Search/loading/error/load-more/view automation IDs unchanged.
- `cypress/e2e/path.cy.ts` fixtures include short/long name+description cards; new assertions for header/body/no-status, equal row width/height, and column counts 1→8 (capped at 8 past 2560px).

### Test results
- `npm run test` — **pass** (9 files / 50 tests)
- `npm run build` — **pass**
- `npm run lint` — **unavailable** (no `lint` script in package.json)
- `npm run container` — **pass** (image `ghcr.io/mentor-forge/mentorhub_mentee_spa:latest`)
- `npm run service` — **pass** (`mentorhub-mentee_spa-1` recreated/started)
- `npm run cypress:run` — **pass** (22/22 across journey, navigation, path, resource; path spec 7/7)

### Notes for L108
- Paths validates the local grid end-to-end: equal-width/equal-height rows, 1→8 columns, collapsed contract unchanged from L106.
- Paths-specific presentation (name-as-title, description-only body, no status chip, fluid page container, path automation IDs, view routing) must stay out of the shared harvest scope.
- Shared harvest should cover: CSS Grid 1→8 breakpoints, slot flattening/`automationId`, expanded stretch + collapsed non-stretch MhCard overrides, demo/tests/README, then publish + bump this SPA and remove the local prototype.
- Status chip automation `path-list-path-*-status-display` was removed from the list page only; Path view page still shows status.
