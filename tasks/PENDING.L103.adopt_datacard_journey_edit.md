# L103 – Adopt DataCard + typed editors on Journey page

**Status**: Pending  
**Type**: Feature  
**Depends On**: L102_adopt_card_grid_list_pages  
**Description**: Convert `JourneyEditPage` to `DataCard` + configurator-type editors; replace hard-coded status select with `EnumEditor` backed by runtime `/api/config` enumerators.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — DataCard, typed editors, EnumEditor / EnumArrayEditor, DurationEditor / DateTimeEditor
- `../mentorhub_spa_utils/demo/pages/EditorsPage.vue` — DataCard + editor composition
- `README.md`
- `src/App.vue` — editor config provided in L101
- `src/pages/JourneyEditPage.vue` — current `AutoSaveSelect` with hard-coded `statusOptions = ['active', 'archived']`
- `src/api/types.ts` — `Journey`, `JourneyUpdate`, breadcrumbs, library/now timing fields
- `cypress/e2e/journey.cy.ts` — status auto-save and automation ids
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

**OpenAPI / field typing**: Prefer the running Mentee API OpenAPI (`npm run api`, then `curl http://localhost:8393/docs/openapi.yaml`) to confirm configurator types for Journey fields. Do **not** hard-code enumerator option lists from OpenAPI; only use schemas to choose which editor component to mount.

## Goals

- Journey view/edit UI uses `DataCard` with `model`, appropriate `nameField` (if any), and `onSave` wired to existing Journey PATCH / field-update mutation.
- Replace `AutoSaveSelect` status control with `EnumEditor`:
  - Pass case-sensitive `enums` matching the dictionary/enumerator name for journey status
  - Options and labels resolve from provided `/api/config.enumerators` only
  - No hard-coded `statusOptions` / `items` arrays; do not invent values when config is loading, missing, or the enumerator name is unknown
- Prefer typed editors over new `AutoSaveField` / `AutoSaveSelect` usage for remaining Journey fields:
  - `IdentifierEditor` (or readonly identifier pattern) for `profile_id`
  - `BreadcrumbDisplay` for `created` / `saved` where applicable
  - `DateTimeEditor` / `DurationEditor` for any date-time or duration fields that appear as editable (or structured display) on this page — do **not** ask users to type raw ISO wire formats
- If any Journey field is configurator `enum_array`, use `EnumArrayEditor` with constrained autocomplete + removable in-input pills, persisting an ordered `string[]`. If none exist on this page, document that in Execution Notes (do not invent a fake enum_array field).
- Keep Now / Next / Library summary counts usable; migrate their chrome to MhCard / CardGrid only where it removes duplicate local cards without changing product behavior.
- Preserve stable `data-automation-id`s (update Cypress if ids change intentionally; prefer keeping `journey-edit-status-select` or document the new id).
- Adoption is additive: do not delete spa_utils legacy exports; only stop using `AutoSaveSelect` on this page once `EnumEditor` behavior is covered.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Unit tests**
  - `npm run test`
  - Add/adjust Vitest coverage for Journey page editor wiring if component tests exist or are warranted (list under Outputs)

- **Build**
  - `npm run build`

- **E2E**
  - Update `cypress/e2e/journey.cy.ts` for DataCard / EnumEditor flows:
    - Page load + automation ids
    - Enum selection + auto-save (blur/change per spa_utils EnumEditor contract)
  - `npm run service` then `npm run cypress:run` — journey specs pass

- **Packaging verification**
  - `npm run container`
  - `npm run service`
  - `npm run cypress:run`

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/pages/JourneyEditPage.vue` — DataCard + typed editors; EnumEditor for status; remove hard-coded status options
- `cypress/e2e/journey.cy.ts` — enum selection / save assertions on stable automation ids

**Create (only if adding page-level unit tests):**

- Vitest file(s) for Journey editor behavior (path recorded in Execution Notes)

The agent must not rewrite Path/Resource view pages in this task.

## Execution Notes

(Reserved for the execution agent.)
