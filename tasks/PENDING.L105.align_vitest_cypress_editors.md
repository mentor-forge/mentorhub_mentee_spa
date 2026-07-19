# L105 – Align Vitest and Cypress to typed-editor automation ids

**Status**: Pending  
**Type**: Feature  
**Depends On**: L104_adopt_datacard_path_resource_views  
**Description**: Finish Vitest and Cypress coverage for spa_utils 0.5.2 adoption — stable `data-automation-id`s, enum selection, EnumArray autocomplete/add/remove/save workflows where present, and removal of assertions tied to replaced local controls/card chrome.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — automation-id conventions
- `../mentorhub_spa_utils/README.md` — editor save triggers; EnumEditor / EnumArrayEditor UX
- `README.md`
- `src/pages/JourneyEditPage.vue` — post-L103 DataCard / EnumEditor
- `src/pages/PathsListPage.vue` / `src/pages/ResourcesListPage.vue` — post-L102 CardGrid
- `src/pages/PathViewPage.vue` / `src/pages/ResourceViewPage.vue` — post-L104 DataCard
- `src/App.vue` — provideEditorConfig (L101)
- `cypress/e2e/journey.cy.ts`
- `cypress/e2e/path.cy.ts`
- `cypress/e2e/resource.cy.ts`
- `cypress/e2e/navigation.cy.ts` — retain; fix only if broken by chrome changes
- Existing Vitest files under `src/**/*.test.ts`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

## Goals

- All migrated pages expose stable `data-automation-id`s used by tests; no reliance on replaced `table` / local `v-card` structure where spa_utils chrome is canonical.
- Cypress covers:
  - Journey enum selection + save (blur/select per EnumEditor)
  - EnumArray autocomplete add / remove / save **if** an `EnumArrayEditor` exists on a mentee page after L103–L104; otherwise document N/A in Execution Notes (do not invent UI solely for tests)
  - Paths/Resources list CardGrid card interaction / search / load-more via automation ids
  - Path/Resource view editor automation ids
- Vitest covers provideEditorConfig / config-missing / unknown-enumerator empty-options behavior at the SPA boundary where practical (without duplicating spa_utils package unit tests).
- Prefer typed-editor workflows over testing legacy `AutoSaveSelect` / hard-coded option arrays.
- Remove obsolete tests that assert duplicate local controls removed during migration.
- Full suite green: unit, build, container, service, Cypress.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Install**
  - `mh` then `npm ci` if needed
  - `npx cypress install` — if binaries missing

- **Unit tests**
  - `npm run test`
  - `npm run test:coverage` optional but recommended if new tests were added

- **Build**
  - `npm run build`

- **Packaging verification**
  - `npm run container`
  - `npm run service`
  - `npm run cypress:run` — full E2E suite passes

## Outputs

Paths are relative to **this SPA repository root**.

**Update (as needed):**

- `cypress/e2e/journey.cy.ts`
- `cypress/e2e/path.cy.ts`
- `cypress/e2e/resource.cy.ts`
- `cypress/e2e/navigation.cy.ts` — only if broken
- Relevant `src/**/*.test.ts` files touched by adoption
- Migrated page Vue files — only for automation-id / leftover chrome cleanup required to make tests pass

**Create (as needed):**

- New Vitest specs for App editor-config provide or page editor wiring

List every newly created test file in Execution Notes. Do not modify files outside this SPA repo.

## Execution Notes

(Reserved for the execution agent.)
