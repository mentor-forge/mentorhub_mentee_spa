# L111 – Enhance Resources list multi-field search

**Status**: Shipped
**Type**: Feature  
**Depends On**: L110_adopt_shared_card_grid  
**Description**: Extend Resources list search beyond name-only so users can search by text in description, url, interests, technologies, or skill_level, using documented API filters and the mentee API handoff for any missing params.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — `ListPageSearch` / list search patterns
- `README.md`
- `src/pages/ResourcesListPage.vue` — name-only search via `ListPageSearch` + `useOffsetList`
- `src/composables/useOffsetList.ts` — currently sends only `name: debouncedQuery`
- `src/api/client.ts` — `getResources` already forwards `name` / `description` / `status`
- `src/api/types.ts` — `Resource` and `ListParams` (incomplete vs OpenAPI Resource schema)
- `src/api/Resource.client.test.ts`
- `cypress/e2e/resource.cy.ts`
- `tasks/ISSUE.mentorhub_mentee_api.resource_multi_field_search.md` — API filter gaps and requested params
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

**OpenAPI (definitive)**: Start the backing API if needed (`npm run api`), then:

```bash
curl -X GET "http://localhost:8393/docs/openapi.yaml"
```

Confirm which `GET /api/resource` query filters exist before wiring the SPA. Do **not** read OpenAPI files from sibling API repos.

**External prerequisite**: Filters for `url`, `interests`, `technologies`, and `skill_level` are documented in `tasks/ISSUE.mentorhub_mentee_api.resource_multi_field_search.md` and must be present in the **running** OpenAPI before those dimensions can be verified end-to-end against a real API. `description` is already supported and must be adopted in this task even if the new filters are not yet live. If the new filters are still absent when this task runs, implement the UI/client for every filter the OpenAPI currently exposes (at least `name` + `description`), wire client/`ListParams` for the remaining params only when OpenAPI confirms them, and record any unfinished dimensions in **Execution Notes** (do not invent undocumented query params against a live API).

## Goals

- Resources list search can target **name**, **description**, **url**, **interests**, **technologies**, and **skill_level** (use OpenAPI field names; `technologies` plural, `skill_level`).
- UI makes the search dimension clear (for example a field selector + shared `ListPageSearch`, or equivalent explicit controls). Preserve stable automation IDs for search; add IDs for any new field selector/controls.
- `useOffsetList` (or a Resources-specific extension) sends the selected filter field(s) to `api.getResources` instead of always mapping the query to `name` only.
- `ListParams` / `api.getResources` include the filter params confirmed by OpenAPI; unit tests cover query-string construction.
- Align `Resource` in `src/api/types.ts` with the OpenAPI fields needed for search and list display of these attributes (at least optional `url`, `interests`, `technologies`, `skill_level`) without rewriting the Resource view page unless required for types to compile.
- Cypress covers searching by more than one field (intercept-based is fine); assert the request query includes the expected param for the selected dimension.
- Do not change Paths list search or CardGrid layout in this task.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Install / static**
  - `npm run test`
  - `npm run build`

- **Unit tests**
  - Extend `src/api/Resource.client.test.ts` for any new `getResources` query params
  - Update or add composable/page tests if present for search param mapping

- **E2E**
  - `npm run api` / `npm run service` as needed
  - Update `cypress/e2e/resource.cy.ts` for multi-field search (name remains covered; add at least description; add url / interests / technologies / skill_level when OpenAPI + intercepts support them)
  - `npm run cypress:run`

- **Packaging verification**
  - `npm run container`
  - `npm run service`
  - `npm run cypress:run`

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/pages/ResourcesListPage.vue` — multi-field search UI
- `src/composables/useOffsetList.ts` — and/or a focused Resources list search helper if a shared name-only composable cannot express field selection cleanly
- `src/api/types.ts` — `ListParams` / `Resource` fields for the search dimensions
- `src/api/client.ts` — forward new resource list query params
- `src/api/Resource.client.test.ts` — query-param coverage
- `cypress/e2e/resource.cy.ts` — multi-field search coverage

The agent must not edit sibling API repositories. If API work is still required, rely on `tasks/ISSUE.mentorhub_mentee_api.resource_multi_field_search.md` for handoff; do not create duplicate issue files unless the handoff needs a factual correction.

## Execution Notes

Plan:

1. Add an explicit Resources search-field selector while preserving the existing search automation ID.
2. Parameterize `useOffsetList` with a selected resource filter field so Paths retain their existing name-only behavior.
3. Forward all OpenAPI-confirmed filters through the client and type the corresponding Resource attributes.
4. Cover serialized client filters and multi-field UI requests in Cypress, then run the required unit, build, container, service, and Cypress checks.

Completed:

- Confirmed the running OpenAPI documents `name`, `description`, `url`, `interests`, `technologies`, and `skill_level` filters for `GET /api/resource`.
- Added a Resources field selector and mapped its selected field through `useOffsetList`; Paths retain their prior behavior.
- Added client/type coverage for every confirmed resource filter and Cypress assertions for each selectable search dimension.
- Passed `npm run test` (42 tests), `npm run build`, `npm run container`, `npm run service`, and `npm run cypress:run` (26 tests).
