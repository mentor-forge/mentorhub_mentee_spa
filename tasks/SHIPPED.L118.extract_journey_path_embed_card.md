# L118 – Extract embeddable JourneyPathEmbedCard with lazy Path detail load

**Status**: Shipped  
**Type**: Feature  
**Depends On**: L117_align_journey_mutation_api_client  
**Description**: Create a reusable read-only Path embed card for the Journey **Later** section — lazy-loads `PathDetail` via `getPath` when expanded, nested module/topic/resource layout matching `PathViewPage`, without page-level chrome.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — `MhCard`, `DataCard`, typed editors, lazy-load pattern
- `README.md`
- `src/pages/PathViewPage.vue` — read-only nested path layout (L116)
- `src/components/ResourceViewCard.vue` — lazy resource detail embed (L115)
- `src/api/client.ts` — `getPath`
- `src/api/types.ts` — `PathDetail`
- `src/api/Path.client.test.ts`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

**OpenAPI (definitive)**:

```bash
curl -X GET "http://localhost:8393/docs/openapi.yaml"
```

**Layout contract** — embeddable path card (Journey Later section and potential reuse):

```
┌─ Path: {name} (collapsible; default collapsed; lazy fetch on expand) ── [Promote Path] ─┐
│  Description (prominent, full width)                                                      │
│  technologies · interests (two-column read-only EnumArrayEditor)                          │
│  ┌─ Module (collapsed) ─────────────────────────────────────────── [Promote Module] ────┐ │
│  │  description · nested Topic cards · ResourceViewCard per resource (embedMode)       │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Read-only** — no add/delete/reorder/drag controls.
- **Lazy load**: `useQuery` for `api.getPath(pathId)` with `enabled` when the outer card is expanded (`!collapsed`). Show loading spinner in card body while fetching; surface errors via snackbar or inline error text.
- Do **not** duplicate the admin Administration sub-card from `PathViewPage` in embed mode (Journey page has its own admin card).
- **Action slots for L120**:
  - **`#actions`** on outer path card — parent injects **Promote Path** (`promoteJourneyPath`).
  - **`#module-actions`** scoped slot (or equivalent) on each module card — parent injects **Promote Module** (`promoteJourneyModule`) with `pathId` + `module.name`.

## Goals

- **`src/components/JourneyPathEmbedCard.vue`** (new):
  - **Props**: `pathId: string` (required); optional `automationIdPrefix` (default derived from `pathId` hash or index passed by parent); optional `defaultCollapsed?: boolean` (default `true`).
  - **Lazy `getPath`**: fetch only when expanded; cache via TanStack Query key `['path', pathId]`.
  - **UI parity** with L116 `PathViewPage` body: description, two-column `technologies`/`interests`, nested collapsed module → topic → `ResourceViewCard` (`embedMode=true`) per resource.
  - **`provideDataCardContext`** for read-only typed editors on path fields (same pattern as `PathViewPage`).
  - Stable **`data-automation-id`** values under `{prefix}-*` (loading, description, modules, topics, resource embeds, collapse toggles).
  - **`#actions` slot** forwarded to outer `MhCard` `#actions`.
  - **Per-module actions slot** (e.g. `#module-actions="{ module, moduleIndex }"`) on each nested module `MhCard` for L120 Promote Module buttons.
- **No changes** to `JourneyEditPage.vue`, `PathViewPage.vue`, or mutation wiring in this task.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Unit tests**
  - `npm run test`

- **Build**
  - `npm run build`

- **Dev verification**
  - `npm run api`
  - `npm run dev`
  - Temporary mount in a story/page or dev-only route is optional; primary verification is build + unit tests. Full Journey integration is L119.

- **Packaging verification**
  - `npm run container`

## Outputs

Paths are relative to **this SPA repository root**.

- `src/components/JourneyPathEmbedCard.vue` — lazy read-only path embed card (new)

## Execution Notes

- Added `JourneyPathEmbedCard.vue` with lazy `getPath` on expand, PathViewPage-parity body, `#actions` and `#module-actions` slots, and embedded read-only `ResourceViewCard` entries.

Testing: `npm run test` passed (49 tests); `npm run build` passed.
