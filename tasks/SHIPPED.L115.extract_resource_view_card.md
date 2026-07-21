# L115 – Extract embeddable ResourceViewCard from ResourceViewPage

**Status**: Pending  
**Type**: Feature  
**Depends On**: L114_align_path_detail_api_client  
**Description**: Refactor resource detail presentation into an embeddable `ResourceViewCard` component so `ResourceViewPage` and read-only resource cards nested under `PathViewPage` share the same UI.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — `MhCard`, `DataCard`, typed editors, lazy-load pattern
- `README.md`
- `src/pages/ResourceViewPage.vue` — single top-level `MhCard`, lazy Aggregation/Notes sub-cards, admin Administration card (L113)
- `src/pages/PathViewPage.vue` — will embed resource cards in L116
- `src/api/client.ts` — `getResource`, `getAggregationDetail`
- `src/api/types.ts` — `ResourceDetail`, `AggregationDetail`
- `cypress/e2e/resource.cy.ts`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

**Layout contract** — embeddable resource card (standalone on `/resources/:id` and nested under Path topics):

```
┌─ Resource: {name} (collapsible; default collapsed when embedded) ──────────────┐
│  Resource fields — two-column layout (same as today's ResourceViewPage)         │
│  ┌─ Aggregation (collapsed) ────────────────────────────────────────────────┐ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│  ┌─ Notes (collapsed) ──────────────────────────────────────────────────────┐ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│  ┌─ Administration (collapsed, admin only) ─────────────────────────────────┐ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────┘
```

- **Read-only** — no add/delete/reorder controls (editable ordered lists are deferred to `mentorhub_mentor_spa`).
- When **`embedMode=true`** (Path nested use): outer card starts **collapsed**; omit page-level chrome (“Back to List”); title = resource `name`; fetch full resource by `resourceId` via existing API (path response only supplies summary ids/names for list keys — expanded card loads detail).

## Goals

- **`src/components/ResourceViewCard.vue`**:
  - **Props**: `resourceId: string` (required); optional `automationId` / `automationIdPrefix`; `embedMode?: boolean` (default `false`).
  - **Data loading**: same `useQuery` pattern as `ResourceViewPage` for `getResource` and lazy `getAggregationDetail`.
  - **UI parity** with L113 `ResourceViewPage`: all Resource fields in two columns, Aggregation/Notes sub-cards (lazy), admin Administration sub-card gated by `useRoles` / `hasRole('admin')`.
  - **`embedMode`**: `MhCard` / wrapper uses `v-model:collapsed` default **`true`**; collapse caret only — no list-management buttons.
- **`src/pages/ResourceViewPage.vue`**: thin page shell — page heading, loading/error snackbar, **`ResourceViewCard`** with `embedMode=false`, **Back to List** in card `#actions`. No functional regression.
- **`cypress/e2e/resource.cy.ts`**: update selectors only if automation ids move; all existing resource E2E tests pass.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Unit tests**
  - `npm run test`

- **Build**
  - `npm run build`

- **Dev verification**
  - `npm run api`
  - `npm run dev`
  - Open `/resources/:id` — confirm identical UX to pre-refactor

- **E2E**
  - `npm run service`
  - `npm run cypress:run -- --spec cypress/e2e/resource.cy.ts`

- **Packaging verification**
  - `npm run container`
  - `npm run service`
  - `npm run cypress:run -- --spec cypress/e2e/resource.cy.ts`

Do **not** change `PathViewPage.vue` in this task.

## Outputs

Paths are relative to **this SPA repository root**.

- `src/components/ResourceViewCard.vue` — embeddable read-only resource detail card (new)
- `src/pages/ResourceViewPage.vue` — refactored to compose `ResourceViewCard`
- `cypress/e2e/resource.cy.ts` — minimal selector fixes if needed

## Execution Notes

Extracted `ResourceViewCard.vue` with `resourceId`, `embedMode`, and `automationIdPrefix` props. Standalone page uses `embedMode=false` (non-collapsible top card); embed mode defaults collapsed with collapse caret. `ResourceViewPage` is now a thin shell with heading and Back to List actions slot.

Testing: `npm run test` passed (43 tests); `npm run build` passed; `npm run container` passed; `npm run cypress:run -- --spec cypress/e2e/resource.cy.ts` passed (13 tests).
