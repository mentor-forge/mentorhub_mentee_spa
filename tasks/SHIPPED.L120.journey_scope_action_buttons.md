# L120 – Journey scope action buttons and complete-resource dialog

**Status**: Shipped  
**Type**: Feature  
**Depends On**: L119_restructure_journey_detail_page  
**Description**: Wire Journey mutation buttons on card title rows — Promote Path and Promote Module (later → next), Advance resource (next → now), Done (now → library with rating/notes dialog) — backed by L117 API client methods and journey query invalidation.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `src/pages/JourneyEditPage.vue` — L119 section layout
- `src/components/JourneyPathEmbedCard.vue` — `#actions` and `#module-actions` slots (L118)
- `src/components/ResourceViewCard.vue` — `#actions` slot (L115)
- `src/api/client.ts` — `advanceJourneyResource`, `completeJourneyResource`, `promoteJourneyPath`, `promoteJourneyModule` (L117)
- `src/api/types.ts` — `JourneyCompleteInput`
- `src/api/Journey.client.test.ts`
- `cypress/e2e/journey.cy.ts`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

**OpenAPI (definitive)**:

```bash
curl -X GET "http://localhost:8393/docs/openapi.yaml"
```

**Action wiring**:

| UI control | Location | API | Behavior |
|------------|----------|-----|----------|
| **Promote Path** | `JourneyPathEmbedCard` `#actions` | `PATCH /api/journey/promote/path/{path_id}` | Copy all modules from Path onto `next`, remove Path from `later`; invalidate `['journey']`; path card disappears from Later |
| **Promote Module** | `JourneyPathEmbedCard` `#module-actions` | `PATCH /api/journey/promote/module/{path_id}/{module_name}` | Copy one module onto `next`; Path remains in `later`; disable/hide when module name already exists in `journey.next` (client-side guard) or after successful promote |
| **Advance** | `ResourceViewCard` `#actions` in **Next** section | `PATCH /api/journey/advance/{resource_id}` | Pass MongoDB Resource id from `topic.resources[]`; invalidate journey on success |
| **Done** | `ResourceViewCard` `#actions` in **Now** section | `PATCH /api/journey/complete/{resource_id}` | Opens dialog; on confirm, send `JourneyCompleteInput`; invalidate journey on success |

Promote mutations return updated `Journey` and do **not** create Event documents (per OpenAPI). Surface `404` when Path/module not in `later` or module name already in `next` via snackbar.

**Complete dialog requirements**:

- Modal dialog triggered by **Done** on a Now resource card.
- Collect **rating** (required for submit — integer 1–4 stars, match OpenAPI `JourneyCompleteInput.rating` constraints).
- Collect **notes** (optional multiline text → `note` field).
- Optional **duration** field using `DurationEditor` or equivalent if product wants time-spent capture (maps to `JourneyCompleteInput.duration` ISO 8601 duration).
- Cancel dismisses without mutation; Confirm calls `completeJourneyResource` and closes on success.
- Disable Confirm while mutation pending; show errors via existing snackbar / `useErrorHandler`.
- Stable automation ids: `journey-complete-dialog`, `journey-complete-rating`, `journey-complete-note`, `journey-complete-confirm`, `journey-complete-cancel`, per-resource `journey-now-{index}-done-button`, `journey-later-{index}-promote-path-button`, `journey-later-{pathIndex}-module-{moduleIndex}-promote-button`, etc.

**Identifier resolution**:

- Mutation endpoints require Resource **ObjectId** path parameters. When `journey.now[].resource_id` is a Resource name (legacy advance behavior), resolve the id from the loaded `ResourceViewCard` query (`resource._id`) before calling complete/advance.
- **Promote Module** passes exact `module.name` from loaded `PathDetail` (must match Path dictionary word pattern).

## Goals

- **`src/pages/JourneyEditPage.vue`** (and small extracted dialog component if it keeps the page readable):
  - **`useMutation`** wrappers for `promoteJourneyPath`, `promoteJourneyModule`, `advanceJourneyResource`, and `completeJourneyResource` with `onSuccess` → `queryClient.invalidateQueries({ queryKey: ['journey'] })`.
  - **Later — path card**: **Promote Path** button in each `JourneyPathEmbedCard` `#actions`; single-click (no confirm dialog unless product requires).
  - **Later — module cards**: **Promote Module** button via `#module-actions` scoped slot; pass `pathId` and `module.name`; disable while mutation in flight for that module.
  - **Next**: **Advance** button per resource embed; disable/hide while mutation in flight for that resource id.
  - **Now**: **Done** button per resource embed opening complete dialog described above.
  - **Library**: no action buttons (read-only).
  - Preserve L119 layout and collapse behavior; do not regress status edit.
- **`src/components/JourneyCompleteDialog.vue`** (new, recommended):
  - Props: `modelValue`, `resourceId`, `resourceName?`; emits confirm with `JourneyCompleteInput`, cancel/close.
  - Encapsulates rating + note (+ optional duration) form validation.
- Button automation ids on all action controls for L121 E2E.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Unit tests**
  - `npm run test`
  - Add Vitest for dialog validation if extracted (optional; list under Outputs)

- **Build**
  - `npm run build`

- **Dev verification**
  - `npm run api`
  - `npm run dev`
  - Manually exercise Promote Path, Promote Module, Advance, and Done against seeded journey data; verify journey sections refresh after each mutation

- **E2E (smoke)**
  - `npm run service`
  - `npm run cypress:run -- --spec cypress/e2e/journey.cy.ts` — existing specs still pass

- **Packaging verification**
  - `npm run container`

## Outputs

Paths are relative to **this SPA repository root**.

- `src/pages/JourneyEditPage.vue` — mutation buttons, dialog wiring, query invalidation
- `src/components/JourneyCompleteDialog.vue` — rating/notes complete dialog (new)
- Optional Vitest: `src/components/JourneyCompleteDialog.test.ts` or page-level test file (only if added)

## Execution Notes

- Wired Promote Path, Promote Module, Advance, and Done actions with journey query invalidation.
- Added `JourneyCompleteDialog.vue` for rating and notes on complete.

Testing: `npm run test` passed (49 tests); `npm run build` passed.
