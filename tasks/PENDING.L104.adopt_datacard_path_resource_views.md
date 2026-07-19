# L104 – Adopt DataCard + typed editors on Path and Resource views

**Status**: Pending  
**Type**: Feature  
**Depends On**: L103_adopt_datacard_journey_edit  
**Description**: Convert Path and Resource view pages to `DataCard` + type-aligned editors (read-only where the API is view-only), including runtime `EnumEditor` for status and structured editors for any date-time / duration / enum_array fields that appear.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — DataCard + typed editors; EnumEditor / EnumArrayEditor; DurationEditor / DateTimeEditor
- `../mentorhub_spa_utils/demo/pages/EditorsPage.vue`
- `README.md`
- `src/pages/PathViewPage.vue` — readonly `v-text-field` / `v-textarea` chrome
- `src/pages/ResourceViewPage.vue` — same pattern
- `src/api/types.ts` — `Path`, `Resource`
- `cypress/e2e/path.cy.ts`
- `cypress/e2e/resource.cy.ts`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

**OpenAPI / field typing**: Confirm configurator types from the running API OpenAPI (`curl http://localhost:8393/docs/openapi.yaml`). Use schemas only to pick editors; enumerator **values** must come from provided `/api/config`, never hard-coded lists or OpenAPI enums.

## Goals

- `PathViewPage` and `ResourceViewPage` use `DataCard` (`model`, `nameField`, `onSave` only if edits are supported; view-only pages may pass a no-op or omit save and set `editable=false` on editors).
- Map fields to typed editors, for example:
  - name → `WordEditor` or `SentenceEditor` as appropriate
  - description → `MarkdownEditor` or `SentenceEditor` as appropriate
  - status → `EnumEditor` with case-sensitive `enums` reference (not a plain text field)
- Replace any configurator `enum_array` fields with `EnumArrayEditor` (constrained autocomplete, removable pills, ordered `string[]` persistence). If none exist, note that in Execution Notes.
- Use `DurationEditor` / `DateTimeEditor` where those types appear — do not present raw ISO wire strings as the editing UX.
- Prefer typed editors over introducing new `AutoSaveField` / `AutoSaveSelect` usage.
- Remove duplicate local `v-card` field chrome where DataCard + editors replace it.
- Keep back-to-list navigation; place actions in MhCard/DataCard title-bar actions when appropriate.
- Stable `data-automation-id`s on all interactive/view fields for Cypress/Vitest.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Unit tests**
  - `npm run test`

- **Build**
  - `npm run build`

- **E2E**
  - Extend path/resource Cypress coverage as needed to assert DataCard / editor automation ids (including enum display/selection if editable)
  - `npm run service` then `npm run cypress:run`

- **Packaging verification**
  - `npm run container`
  - `npm run service`
  - `npm run cypress:run`

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/pages/PathViewPage.vue` — DataCard + typed editors
- `src/pages/ResourceViewPage.vue` — DataCard + typed editors
- `cypress/e2e/path.cy.ts` — automation-id assertions for view editors (as needed)
- `cypress/e2e/resource.cy.ts` — automation-id assertions for view editors (as needed)

The agent must not change list-page layout again unless a broken selector requires a minimal fix (document in Execution Notes).

## Execution Notes

(Reserved for the execution agent.)
