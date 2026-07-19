# L102 – Adopt CardGrid + MhCard on list pages

**Status**: Pending  
**Type**: Feature  
**Depends On**: L101_provide_editor_config  
**Description**: Convert Paths and Resources list UIs from table chrome to `CardGrid` + `MhCard` with title-bar actions, using spa_utils default responsive breakpoints.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — MhCard / CardGrid defaults (`cols=12 sm=6 md=4 lg=3`)
- `../mentorhub_spa_utils/demo/pages/DashboardPage.vue` — list-style CardGrid + MhCard example
- `README.md`
- `src/pages/PathsListPage.vue` — current `v-data-table` + `ListPageSearch` + `useInfiniteScroll`
- `src/pages/ResourcesListPage.vue` — same pattern
- `cypress/e2e/path.cy.ts` — asserts `table` rows / search
- `cypress/e2e/resource.cy.ts` — asserts `table` rows / search
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

## Goals

- `PathsListPage` and `ResourcesListPage` render items with `CardGrid` (keep default breakpoints unless a documented override is required) and one `MhCard` per item.
- Each card shows a clear title (name) and summary body (description / status as appropriate); title-bar `#actions` (or equivalent MhCard actions slot) holds navigation or other list actions instead of ad-hoc local card chrome.
- Search remains available (existing `ListPageSearch` is fine during migration).
- Pagination / load-more continues to work with the existing list data source; prefer header-based offset/size list APIs if the client already supports them, but do **not** expand scope to rewrite the API client unless required for the card UI to function.
- Remove duplicate local `v-card` / table chrome where spa_utils CardGrid + MhCard replaces it.
- Stable `data-automation-id`s on cards, search, and load-more so Cypress can be updated without brittle table selectors.
- Do **not** remove working legacy list helpers from the package dependency; only stop using table layout on these two pages.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Unit tests**
  - `npm run test`

- **Build**
  - `npm run build`

- **E2E (required — selectors change)**
  - `npm run api` / `npm run service` as needed
  - Update `cypress/e2e/path.cy.ts` and `cypress/e2e/resource.cy.ts` to assert CardGrid / MhCard automation ids instead of `table` / `tbody tr`
  - `npm run cypress:run` — path and resource specs pass (full suite preferred)

- **Packaging verification**
  - `npm run container`
  - `npm run service`
  - `npm run cypress:run`

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/pages/PathsListPage.vue` — CardGrid + MhCard list UI
- `src/pages/ResourcesListPage.vue` — CardGrid + MhCard list UI
- `cypress/e2e/path.cy.ts` — card/automation-id assertions
- `cypress/e2e/resource.cy.ts` — card/automation-id assertions

The agent must not rewrite Journey edit/view pages in this task.

## Execution Notes

(Reserved for the execution agent.)
