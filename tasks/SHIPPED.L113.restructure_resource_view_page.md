# L113 – Restructure Resource view with lazy-loaded aggregation and notes

**Status**: Shipped  
**Type**: Feature  
**Depends On**: L112_align_resource_detail_api_client  
**Description**: Redesign `ResourceViewPage` as a single top-level `DataCard` showing resource fields, with two nested sub-cards for aggregation metrics and notes. Sub-cards start collapsed; aggregation and notes load only when a sub-card is expanded.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — `DataCard` (`v-model:collapsed`), typed editors, `CardGrid`
- `../mentorhub_spa_utils/demo/pages/EditorsPage.vue` — collapsed `DataCard` example
- `README.md`
- `src/pages/ResourceViewPage.vue` — current flat read-only card (name, description, status only)
- `src/pages/PathViewPage.vue` — read-only `DataCard` + typed editors pattern
- `src/api/types.ts` — `ResourceDetail`, `AggregationDetail`, etc. (from L112)
- `src/api/client.ts` — `getResource`, `getAggregationDetail`
- `src/api/Resource.client.test.ts`
- `cypress/e2e/resource.cy.ts`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

**OpenAPI (definitive)**:

```bash
curl -X GET "http://localhost:8393/docs/openapi.yaml"
```

Use schemas only to pick editors; enumerator **values** must come from `/api/config` at runtime, never hard-coded OpenAPI enum lists.

**Layout contract** (from product requirement):

```
┌─ DataCard: Resource (top-level, expanded) ─────────────────────┐
│  [Back to List]                                                 │
│  Resource fields (all OpenAPI Resource properties)              │
│  ┌─ DataCard: Aggregation (collapsed by default) ─────────────┐ │
│  │  Metrics editors / loading / empty state                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌─ DataCard: Notes (collapsed by default) ──────────────────┐ │
│  │  Read-only note list / loading / empty state              │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Goals

- **`ResourceViewPage.vue`** uses **one top-level `DataCard`** (remove the outer `CardGrid` wrapper unless a single-card grid is required for layout — prefer one card spanning the page content column).
- **Initial load**: `useQuery` with `api.getResource(resourceId)`; bind **only** `detail.resource` to the top-level card model. Do **not** render aggregation or notes from the initial `ResourceDetail` response (defer to lazy fetch below).
- **Resource fields**: Display all meaningful OpenAPI **`Resource`** properties using typed read-only editors (`editable=false`), for example:
  - `name` → `WordEditor`
  - `description` → `SentenceEditor`
  - `url` → `UrlEditor`
  - `type`, `cost`, `skill_level`, `status` → `EnumEditor` with runtime `enums` keys from config (confirm keys from OpenAPI/configurator; do not hard-code option lists)
  - `interests`, `technologies` → `EnumArrayEditor`
  - `last_verified` → `DateTimeEditor`
  - `created`, `saved` → `BreadcrumbDisplay`
- **Two nested sub-cards** inside the top-level card body:
  1. **Aggregation** — title e.g. “Aggregation”; **`v-model:collapsed`** default **`true`**
  2. **Notes** — title e.g. “Notes”; **`v-model:collapsed`** default **`true`**
- **Lazy load**: A separate `useQuery` for `api.getAggregationDetail(resourceId)` with `enabled` when **either** sub-card is expanded (`!aggregationCollapsed || !notesCollapsed`). Use TanStack Query caching so expanding the second sub-card does not refetch unnecessarily.
- **Aggregation sub-card** (when expanded): show loading spinner while fetching; then read-only editors for `ResourceAggregation` fields (`note_count`, `completions`, `hits`, `duration`, `rating_count`, `rating_sum`, `created`, `last_saved`) using appropriate editors (`CountEditor`, `DurationEditor`, `BreadcrumbDisplay`, etc.). Handle missing/zero metrics gracefully.
- **Notes sub-card** (when expanded): show loading spinner while fetching; render a read-only list of `Note` documents (note text, status, created/saved). Empty state when `notes` is empty. Notes do not need per-note nested `DataCard`s unless that improves clarity — a simple list inside the Notes sub-card is fine.
- Preserve **Back to List** in the top-level card `#actions` slot.
- Stable **`data-automation-id`** values on the page, both sub-cards, key fields, collapse toggles, lazy-load loading indicators, and note list items (follow existing `resource-view-*` naming).
- **Error handling**: reuse `useErrorHandler` for the primary resource query; surface aggregation fetch errors in the expanded sub-card(s) or via snackbar.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Install / static**
  - `npm run lint`

- **Unit tests**
  - `npm run test`

- **Build**
  - `npm run build`

- **Dev verification** (API at `localhost:8393`, SPA dev server)
  - `npm run api` — start backing database and API containers (if not already running)
  - `npm run dev` — run dev server locally
  - Open a resource detail page: confirm resource fields render; sub-cards start collapsed; expanding Aggregation triggers fetch and shows metrics; expanding Notes triggers fetch (or uses cached aggregation detail) and shows note list

- **E2E**
  - Extend `cypress/e2e/resource.cy.ts`:
    - Intercept `GET **/api/resource/*` with a `ResourceDetail`-shaped body (`resource` nested)
    - Intercept `GET **/api/aggregation/*` with `AggregationDetail` (defer reply until sub-card expand if testing lazy load)
    - Assert top-level card and resource field automation IDs
    - Assert sub-cards are collapsed initially (body content not visible)
    - Expand Aggregation sub-card → wait for aggregation intercept → assert metric display
    - Expand Notes sub-card → assert note list (or empty state)

- **Packaging verification**
  - `npm run container`
  - `npm run service`
  - `npm run cypress:run`

## Outputs

Paths are relative to **this SPA repository root**.

- `src/pages/ResourceViewPage.vue` — single top-level `DataCard`, nested collapsed sub-cards, lazy aggregation/notes load, full resource field display
- `cypress/e2e/resource.cy.ts` — detail page layout, collapse defaults, lazy-load intercept coverage

The agent must not change `src/api/types.ts` or `src/api/client.ts` except for minimal compile fixes strictly required by L112 types (document in Execution Notes if any).

## Execution Notes

Restructured `ResourceViewPage` to a single top-level `DataCard` with all OpenAPI Resource fields via typed read-only editors (configurator enum keys: `resource_type`, `Costs`, `Skills`, `interests`, `technologies`, `resource_status`). Nested Aggregation and Notes sub-cards use `v-model:collapsed` default `true`. Lazy `getAggregationDetail` query enables when either sub-card expands; notes empty state renders only after aggregation detail loads (fixes premature “No notes yet” before fetch).

Testing: `npm run test` passed (43 tests); `npm run build` passed; `npm run container` passed; `npm run cypress:run -- --spec cypress/e2e/resource.cy.ts` passed (12 tests). Full suite: 29 Cypress tests when dev server available on 8394.
