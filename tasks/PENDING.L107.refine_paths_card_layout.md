# L107 – Refine the Paths card layout

**Status**: Pending
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

Reserved for the execution agent to record plan, commands run, test results, and follow-ups.
