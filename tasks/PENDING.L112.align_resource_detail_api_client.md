# L112 – Align Resource detail API types and client with OpenAPI

**Status**: Pending  
**Type**: Feature  
**Depends On**: L111_enhance_resource_multi_field_search  
**Description**: Update TypeScript types and the API client so Resource detail, aggregation, and note shapes match the running Mentee API OpenAPI contract, including `ResourceDetail` for `GET /api/resource/{resource_id}` and a new client method for `GET /api/aggregation/{resource_id}`.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `src/api/types.ts` — current `Resource` (partial vs OpenAPI)
- `src/api/client.ts` — `getResource` currently typed as flat `Resource`
- `src/api/Resource.client.test.ts`
- `src/pages/ResourceViewPage.vue` — consumer of `api.getResource`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

**OpenAPI (definitive)**: Start the backing API if needed (`npm run api`), then:

```bash
curl -X GET "http://localhost:8393/docs/openapi.yaml"
```

Confirm the following before implementation (do **not** read OpenAPI files from sibling API repos):

- `GET /api/resource/{resource_id}` returns **`ResourceDetail`**: `{ resource, aggregation?, notes[] }`
- `GET /api/aggregation/{resource_id}` returns **`AggregationDetail`**: `{ aggregation, notes[] }`
- Schemas: **`Resource`**, **`ResourceAggregation`**, **`Note`**, **`ResourceDetail`**, **`AggregationDetail`**

**External prerequisite**: The running Mentee API must expose the composite `ResourceDetail` response and the `/api/aggregation/{resource_id}` endpoint described above. If either is missing from the served OpenAPI, set **Status** to `Blocked` and stop.

## Goals

- `src/api/types.ts` includes interfaces aligned with OpenAPI:
  - **`Resource`** — full read-only resource document (`name`, `description`, `url`, `type`, `cost`, `skill_level`, `interests`, `technologies`, `last_verified`, `status`, `created`, `saved`, …)
  - **`ResourceAggregation`** — metrics (`note_count`, `completions`, `hits`, `duration`, `rating_count`, `rating_sum`, `created`, `last_saved`, …)
  - **`Note`** — note document (`resource_id`, `profile_id`, `note`, `status`, `created`, `saved`)
  - **`ResourceDetail`** — `{ resource: Resource; aggregation: ResourceAggregation | null; notes: Note[] }`
  - **`AggregationDetail`** — `{ aggregation: ResourceAggregation; notes: Note[] }`
- `api.getResource(resourceId)` returns **`ResourceDetail`** (not a flat `Resource`).
- Add **`api.getAggregationDetail(resourceId)`** calling `GET /api/aggregation/{resource_id}` and returning **`AggregationDetail`**.
- Existing list helpers (`getResources`, `ListParams`) continue to work unchanged.
- `Resource.client.test.ts` covers:
  - `getResource` parsing a composite `ResourceDetail` mock
  - `getAggregationDetail` request URL and response parsing
  - Existing list/filter tests still pass

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Install / static**
  - `npm run install` — refresh dependencies if needed (CodeArtifact auth; run `mh` first if needed)
  - `npm run lint`

- **Unit tests**
  - `npm run test` — Vitest, including updated `Resource.client.test.ts`

- **Build**
  - `npm run build` — compile sources (fix any type errors in consumers minimally; full page work is L113)

- **Packaging verification**
  - `npm run container`
  - `npm run service`
  - `npm run cypress:run` — existing specs should still pass (page may not yet use new shapes fully)

## Outputs

Paths are relative to **this SPA repository root**.

- `src/api/types.ts` — add/update `Resource`, `ResourceAggregation`, `Note`, `ResourceDetail`, `AggregationDetail`
- `src/api/client.ts` — change `getResource` return type; add `getAggregationDetail`
- `src/api/Resource.client.test.ts` — extend mocks and assertions for composite detail and aggregation endpoints

The agent must not update `ResourceViewPage.vue` or Cypress specs in this task (L113).

## Execution Notes

_Reserved for the task execution agent._
