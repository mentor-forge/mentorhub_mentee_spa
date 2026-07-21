# L114 – Align Path detail API client and types

**Status**: Shipped  
**Type**: Feature  
**Depends On**: L113_restructure_resource_view_page  
**Description**: Extend Path detail types and `getPath` client typing so `PathViewPage` can render the read-only `PathDetail` shape returned by `GET /api/path/{path_id}` — `modules[].topics[].resources[]` with enriched resource summaries.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `src/api/types.ts` — current flat `Path` (`_id`, `name`, `description`, `status`)
- `src/api/client.ts` — `getPath` typed as flat `Path`
- `src/api/Path.client.test.ts`
- `src/pages/PathViewPage.vue` — flat read-only `DataCard`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

**OpenAPI (definitive)** — start API if needed (`npm run api`), then:

```bash
curl -X GET "http://localhost:8393/docs/openapi.yaml"
```

Confirmed running schema (mentee API, read-only Path domain):

- **`GET /api/path/{path_id}`** returns **`PathDetail`** (not the list-page `Path` summary).
- **`PathDetail`** top-level properties: `_id`, `name`, `description`, `technologies`, `interests`, `modules[]`, `status`, `created`, `saved`.
- **`modules[]`** → **`PathModuleDetail`**: `name`, `description`, `topics[]`.
- **`topics[]`** → **`PathTopicDetail`**: `name`, `description`, `resources[]`.
- **`resources[]`** → **`PathResourceSummary`**: `_id` (required), `name`, `description` (minimal projection embedded in the path response).
- Path is **read-only** in the mentee API — no PATCH/update endpoint; do not add mutation client methods in this repo.

Enumerator **values** for `technologies` and `interests` come from runtime `/api/config`, not hard-coded OpenAPI enum lists.

## Goals

- **`src/api/types.ts`**: Add interfaces aligned to OpenAPI:
  - `PathResourceSummary`
  - `PathTopicDetail`
  - `PathModuleDetail`
  - `PathDetail` (full detail document)
  - Keep existing flat `Path` for list responses (`GET /api/path`) unless OpenAPI unifies them.
- **`src/api/client.ts`**: Change `getPath(pathId)` return type to **`PathDetail`**.
- **`src/api/Path.client.test.ts`**: Update `getPath` test fixture to nested `PathDetail` shape (at least one module → topic → resource with `_id`, `name`, `description`); assert parsing of enriched `resources[]`.
- Document any list-vs-detail type split briefly in **Execution Notes** for L116.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Unit tests**
  - `npm run test` — `Path.client.test.ts` covers nested `getPath` / `PathDetail` parsing

- **Build**
  - `npm run build`

- **Dev verification**
  - `npm run api`
  - Optional: `curl -H "Authorization: Bearer …" http://localhost:8393/api/path/{id}` — confirm live payload matches types

- **Packaging verification**
  - `npm run container`

The agent must not change `PathViewPage.vue` or UI components in this task.

## Outputs

Paths are relative to **this SPA repository root**.

- `src/api/types.ts` — `PathDetail` and nested module/topic/resource summary types
- `src/api/client.ts` — `getPath` returns `PathDetail`
- `src/api/Path.client.test.ts` — nested detail response coverage

## Execution Notes

Added `PathResourceSummary`, `PathTopicDetail`, `PathModuleDetail`, and `PathDetail` to `types.ts`. Kept flat `Path` for list responses. `getPath` now returns `PathDetail`. Extended `Path.client.test.ts` with nested module/topic/resource fixture.

**List vs detail**: `GET /api/path` → `Path[]`; `GET /api/path/{id}` → `PathDetail`.

Testing: `npm run test` passed (43 tests); `npm run build` passed; `npm run container` passed.
