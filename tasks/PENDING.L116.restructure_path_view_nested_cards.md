# L116 – Restructure PathViewPage with read-only nested module/topic/resource cards

**Status**: Pending  
**Type**: Feature  
**Depends On**: L115_extract_resource_view_card  
**Description**: Redesign `PathViewPage` as one non-collapsible top-level card containing the full path — read-only path fields in a two-column header, nested collapsed module/topic cards, embedded `ResourceViewCard` for each resource, and an admin-only Administration sub-card at the bottom.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — `MhCard`, `DataCard`, typed editors, `EnumArrayEditor`
- `README.md`
- `src/pages/PathViewPage.vue` — current flat read-only view
- `src/pages/ResourceViewPage.vue` — two-column field layout + admin card pattern (L113)
- `src/components/ResourceViewCard.vue` — L115
- `src/composables/useRoles.ts` — admin gating
- `src/api/types.ts` / `src/api/client.ts` — `PathDetail`, nested types (L114)
- `src/api/Path.client.test.ts`
- `cypress/e2e/path.cy.ts`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

**OpenAPI (definitive)**:

```bash
curl -X GET "http://localhost:8393/docs/openapi.yaml"
```

**Out of scope (deferred to `mentorhub_mentor_spa`)**: add/delete/reorder list controls, drag-and-drop, PATCH persistence, and a harvestable `OrderedCardList` component. This page is **view-only**.

**Layout contract**:

```
┌─ Path: {name} (top-level — NOT collapsible) ─────────────────── [Back to List] ─┐
│  Large description (full width, prominent, top of body)                       │
│  ┌─ two columns ─────────────────────────────────────────────────────────────┐ │
│  │  technologies (EnumArrayEditor)  │  interests (EnumArrayEditor)           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌─ Module (collapsed) ─────────────────────────────────────────── [collapse] ─┐ │
│  │  Module description (prominent, top of body)                                │ │
│  │  ┌─ Topic (collapsed) ─────────────────────────────────────── [collapse] ─┐ │ │
│  │  │  Topic description (prominent)                                         │ │ │
│  │  │  ┌─ ResourceViewCard (collapsed, embedMode) ──────────────────────────┐ │ │ │
│  │  │  └───────────────────────────────────────────────────────────────────┘ │ │ │
│  │  └────────────────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌─ Administration (collapsed, admin only) ───────────────────────────────────┐ │
│  │  status · created · saved (BreadcrumbDisplay)                               │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Behavior rules**:

| Level | Collapsible | Default state |
|-------|-------------|---------------|
| Top-level Path card | **No** | Always expanded |
| Module, Topic, Resource embed | Yes | **Collapsed** |
| Administration (admin) | Yes | **Collapsed** |

- Bind page to **`api.getPath(pathId)`** → **`PathDetail`**; use `provideDataCardContext` where typed editors require it (same pattern as `ResourceViewPage`).
- **`status`**, **`created`**, **`saved`** appear **only** in the admin Administration sub-card (mirror `ResourceViewPage` — not in the public two-column header).
- Resource cards: one **`ResourceViewCard`** per `topic.resources[]` entry, keyed by `resource._id`, `embedMode=true`. Path response summaries supply list identity; expanded card loads full resource detail.
- No plus/delete/drag controls anywhere on this page.

## Goals

- **`src/pages/PathViewPage.vue`**:
  - Remove outer `CardGrid` unless required — prefer single full-width top-level card.
  - Top-level **`MhCard`**: **`collapsible=false`**. Title = path `name`. **Back to List** in `#actions`.
  - Body top: path **`description`** — prominent full-width read-only display (`SentenceEditor` or equivalent, `editable=false`).
  - **`v-row` / `v-col`** two-column section below description: **`technologies`** and **`interests`** via read-only **`EnumArrayEditor`** with runtime enum keys from config (confirm keys from OpenAPI/configurator — likely `technologies`, `interests`).
  - **`modules[]`**: `v-for` of collapsible **`MhCard`** / **`DataCard`** items — title = `module.name`, description prominent at top of body, default **`v-model:collapsed=true`**.
  - **`topics[]`** nested inside each module with same collapse/description pattern.
  - **`resources[]`**: nested **`ResourceViewCard`** per item (`resourceId`, `embedMode`, indexed `automationId`).
  - **`DataCard` Administration** at bottom: `v-if="hasAdminRole"`; **`v-model:collapsed`** default **`true`**; read-only **`EnumEditor`** for `status`; **`BreadcrumbDisplay`** for `created` and `saved` in two columns — match `ResourceViewPage` admin sub-card.
  - Stable **`data-automation-id`** values under `path-view-*` prefix (modules, topics, resource embeds, admin card, collapse toggles).
  - Error handling via existing `useErrorHandler` / snackbar pattern.
- **`cypress/e2e/path.cy.ts`**: extend coverage:
  - Intercept `GET **/api/path/path-1` with **`PathDetail`** fixture: nested module → topic → resource summary + top-level `technologies`/`interests`.
  - Assert top-level card visible, **not** collapsible (no collapse button; description/fields always visible).
  - Assert module/topic/resource cards **collapsed** initially (nested body not visible).
  - Expand module → topic list visible; expand topic → resource card visible; expand resource embed → resource field automation ids (stub `GET **/api/resource/*` and optional aggregation intercept).
  - Assert **no** add/plus/delete/drag controls on the page.
  - Admin tests (optional): when roles include admin, Administration card present and collapsed; `status` not visible in main header area.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Unit tests**
  - `npm run test`

- **Build**
  - `npm run build`

- **Dev verification**
  - `npm run api`
  - `npm run dev`
  - Open `/paths/:id` with nested path data: verify layout, collapse defaults, resource embed expansion, admin card gating

- **E2E**
  - `npm run service`
  - `npm run cypress:run -- --spec cypress/e2e/path.cy.ts`

- **Packaging verification**
  - `npm run container`
  - `npm run service`
  - `npm run cypress:run`

## Outputs

Paths are relative to **this SPA repository root**.

- `src/pages/PathViewPage.vue` — read-only nested path view
- `cypress/e2e/path.cy.ts` — nested path layout, collapse defaults, resource embed, no edit controls

## Execution Notes

<!-- Reserved for task execution agent -->
