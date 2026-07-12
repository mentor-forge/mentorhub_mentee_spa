# T998 – Example: Update a detail page from OpenAPI changes

**Status**: Run as needed  
**Type**: Feature  
**Depends On**: none  
**Description**: Parameterized template for updating a read-only detail page after the backing API OpenAPI contract adds or changes a field. Edit the parameter values under **Context** before promoting this task to `Pending`.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`

**Parameters (edit before running)**

- **Resource / domain**: `Resource`
- **Detail page component**: `src/pages/ResourceViewPage.vue`
- **OpenAPI schema to align with**: `Resource`
- **Field to surface on the detail page**: `url` (`string`, optional) — external link to the resource source
- **Display label**: `Source URL`
- **External prerequisite**: The running Mentee API already exposes `url` on `GET /api/resource/{ResourceId}` responses and in its served OpenAPI document. Confirm with the curl command below before starting. If the field is not present, set **Status** to `Blocked` and stop.

Fetch the definitive OpenAPI specification from the running API (not from files in another repository):

```bash
curl -X GET "http://localhost:8393/docs/openapi.yaml"
```

**Additional input files** (paths relative to this SPA repository root):

- `src/api/types.ts` — TypeScript interfaces for API responses
- `src/api/client.ts` — API client methods used by the detail page
- `src/pages/ResourceViewPage.vue` — read-only detail view to update
- `src/api/Resource.client.test.ts` — unit tests for Resource client calls
- `cypress/e2e/resource.cy.ts` — E2E coverage for the resource detail flow

## Goals

- `Resource` in `src/api/types.ts` includes the new optional `url` property with the correct type.
- `ResourceViewPage.vue` displays `url` when present (e.g. readonly field or external link) and handles missing values gracefully (e.g. `N/A`).
- The detail page continues to load via `useQuery` and `api.getResource(id)` without breaking existing fields (`name`, `description`, `status`).
- Unit tests pass with mock responses that include the new field.
- Manual or E2E verification confirms the field renders on the detail page against a running API.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Install and static checks**
  - `npm run install` — refresh dependencies after changes (CodeArtifact auth; run `mh` first if needed)
  - `npm run lint` — format check

- **Unit tests**
  - `npm run test` — Vitest unit tests (include updated Resource client/type coverage)

- **Build**
  - `npm run build` — compile sources

- **Dev verification** (API at `localhost:8393`, SPA dev server)
  - `npm run api` — start backing database and API containers (if not already running)
  - `npm run dev` — run dev server locally (separate terminal or background)
  - Open a resource detail page in the browser and confirm `Source URL` renders when the API returns `url`

- **Packaging verification**
  - `npm run container` — build the SPA container image
  - `npm run service` — run db + API + SPA containers
  - `npm run cypress:run` — headless end-to-end tests against a running stack (long running)

## Outputs

Paths are relative to **this SPA repository root**.

- `src/api/types.ts` — add optional `url?: string` to `Resource`
- `src/pages/ResourceViewPage.vue` — display the new `url` field on the detail page
- `src/api/Resource.client.test.ts` — extend mock/fixtures and assertions to cover `url`
- `cypress/e2e/resource.cy.ts` — assert the detail page shows `url` when present in API responses

The agent must not update files outside this list.

## Execution Notes

_Reserved for the task execution agent._
