# L119 – Restructure Journey page as single-card detail with scoped sections

**Status**: Pending  
**Type**: Feature  
**Depends On**: L118_extract_journey_path_embed_card  
**Description**: Redesign `JourneyEditPage` so the full Journey document lives in one non-collapsible top-level card with nested section sub-cards for **Later**, **Next**, **Now**, and **Library**, using lazy Path and Resource embeds — read-only presentation with existing status edit retained at the top.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — `MhCard`, `DataCard`, typed editors
- `README.md`
- `src/pages/JourneyEditPage.vue` — current summary counts + status edit (L103)
- `src/pages/PathViewPage.vue` — nested read-only path pattern (L116)
- `src/components/JourneyPathEmbedCard.vue` — L118
- `src/components/ResourceViewCard.vue` — lazy aggregation/notes sub-cards (L115)
- `src/api/types.ts` — `Journey`, nested `library` / `now` / `next` / `later`
- `src/api/client.ts` — `getMyJourney`, `updateJourney`
- `src/composables/useRoles.ts` — admin gating
- `cypress/e2e/journey.cy.ts` — existing automation ids for status edit
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

**OpenAPI (definitive)**:

```bash
curl -X GET "http://localhost:8393/docs/openapi.yaml"
```

**Layout contract**:

```
┌─ Journey (top-level — NOT collapsible) ────────────────────────────────────────────────┐
│  Status (EnumEditor, editable) · Profile ID (readonly IdentifierEditor)                 │
│                                                                                         │
│  ┌─ Later (section sub-card, collapsible, default collapsed) ─────────────────────────┐ │
│  │  JourneyPathEmbedCard per path id in journey.later[] (lazy path detail)            │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│  ┌─ Next (section sub-card, collapsible, default collapsed) ──────────────────────────┐ │
│  │  Module cards → Topic cards → ResourceViewCard per resource id (embedMode)         │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│  ┌─ Now (section sub-card, collapsible, default collapsed) ───────────────────────────┐ │
│  │  ResourceViewCard per now item (embedMode; aggregation/notes lazy sub-cards)       │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│  ┌─ Library (section sub-card, collapsible, default collapsed) ────────────────────────┐ │
│  │  Per library item: collapsed summary row; expanded ResourceViewCard (read-only)    │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│  ┌─ Administration (admin only, collapsed) — created · saved breadcrumbs              │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Behavior rules**:

| Level | Collapsible | Default state |
|-------|-------------|---------------|
| Top-level Journey card | **No** | Always expanded |
| Later / Next / Now / Library section cards | Yes | **Collapsed** |
| Path embed, Module, Topic, Resource embed | Yes | **Collapsed** |
| Resource Aggregation / Notes sub-cards | Yes | **Collapsed** (via `ResourceViewCard`) |
| Administration (admin) | Yes | **Collapsed** |

- Replace the three **count-only** summary columns (`journey-now-count`, etc.) with the full section bodies above. Remove or repurpose those automation ids (document changes for L121).
- **`journey.later[]`**: array of Path `$oid` strings — one `JourneyPathEmbedCard` per id (path-level and module-level `#actions` slots wired in L120).
- **`journey.next[]`**: embedded module/topic tree from the Journey document (not `getPath`). Each `topic.resources[]` entry is a Resource id — render `ResourceViewCard` with `embedMode=true` (lazy resource detail + aggregation/notes sub-cards).
- **`journey.now[]`**: each item's `resource_id` drives `ResourceViewCard` (`embedMode=true`). Resolve ObjectId for API calls in L120; display may use card title from fetched resource name.
- **`journey.library[]`**: read-only completed resources. Collapsed row shows completion metadata (`completed`, `rating`, `used` when present). Expanded body uses `ResourceViewCard` without mutation actions.
- Preserve existing **status** auto-save via `DataCard`/`EnumEditor` and `updateJourney` PATCH.
- Move **`created` / `saved`** breadcrumbs into admin-only Administration sub-card (mirror `PathViewPage` / `ResourceViewPage` — not in the public header).
- Empty states per section when arrays are empty (e.g. "No paths in Later").
- Stable **`data-automation-id`** prefix `journey-detail-*` / retain `journey-edit-status-select` where possible.

**Out of scope for this task**: Promote Path / Promote Module / Advance / Done buttons and complete dialog (L120).

## Goals

- **`src/pages/JourneyEditPage.vue`** (may rename heading copy to "Journey" detail but keep route `/journey`):
  - Single top-level **`MhCard`** or **`DataCard`**: **`collapsible=false`**. Title = "Journey".
  - Header fields: editable **`EnumEditor`** for `status`; readonly **`IdentifierEditor`** for `profile_id`.
  - Four section **`DataCard`** / **`MhCard`** containers: **Later**, **Next**, **Now**, **Library** — each `v-model:collapsed` default **`true`**.
  - Wire **Later** → `JourneyPathEmbedCard` list keyed by path id.
  - Wire **Next** → nested module/topic/`ResourceViewCard` structure from `journey.next`.
  - Wire **Now** and **Library** → `ResourceViewCard` embeds as described above.
  - Admin **`DataCard`**: `v-if="hasAdminRole"`; **`BreadcrumbDisplay`** for `created` and `saved`.
  - Loading / error handling unchanged (`useQuery` journey, `useErrorHandler` snackbar).
- **No mutation buttons** yet — leave `#actions` slots on path/resource embeds empty or omit until L120.
- Update **`cypress/e2e/journey.cy.ts`** only as needed to keep **status edit** tests passing; defer section/layout E2E to L121.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Unit tests**
  - `npm run test`

- **Build**
  - `npm run build`

- **Dev verification**
  - `npm run api`
  - `npm run dev`
  - Open `/journey` with seeded journey: verify single top card, section collapse defaults, Later path lazy load on expand, Next/Now resource embeds, library read-only expansion

- **E2E (smoke)**
  - `npm run service`
  - `npm run cypress:run -- --spec cypress/e2e/journey.cy.ts` — status edit still passes

- **Packaging verification**
  - `npm run container`
  - `npm run service`
  - `npm run cypress:run -- --spec cypress/e2e/journey.cy.ts`

## Outputs

Paths are relative to **this SPA repository root**.

- `src/pages/JourneyEditPage.vue` — single-card Journey detail with scoped sections
- `cypress/e2e/journey.cy.ts` — minimal updates so status-edit spec still passes

## Execution Notes
