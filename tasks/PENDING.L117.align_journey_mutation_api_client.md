# L117 – Align Journey mutation API client and types

**Status**: Pending  
**Type**: Feature  
**Depends On**: L116_restructure_path_view_nested_cards  
**Description**: Extend `src/api/client.ts` and `src/api/types.ts` with Journey mutation methods backed by the running Mentee API OpenAPI — resource advance (next → now), resource complete (now → library), path promotion (later → next), and module promotion (single module from a later Path → next).

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `src/api/types.ts` — `Journey`, `JourneyUpdate`, nested scope types
- `src/api/client.ts` — `getMyJourney`, `updateJourney` only today
- `src/api/Journey.client.test.ts`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

**OpenAPI (definitive)** — start API if needed (`npm run api`), then:

```bash
curl -X GET "http://localhost:8393/docs/openapi.yaml"
```

Confirmed mutation endpoints (from running OpenAPI):

| Operation | Path | Body | Purpose |
|-----------|------|------|---------|
| `advanceJourneyResource` | `PATCH /api/journey/advance/{resource_id}` | none | Move a resource from `journey.next` into `journey.now`; creates `advanced` Event |
| `completeJourneyResource` | `PATCH /api/journey/complete/{resource_id}` | optional `JourneyCompleteInput` | Complete a resource in `journey.now` → `library`; updates aggregation; creates `completed` Event |
| `promoteJourneyPath` | `PATCH /api/journey/promote/path/{path_id}` | none | Copy **all** modules from a Path in `journey.later[]` onto `journey.next[]` and remove the Path id from `later` |
| `promoteJourneyModule` | `PATCH /api/journey/promote/module/{path_id}/{module_name}` | none | Copy **one** module (exact `module_name` match) from a Path in `later` onto `next`; Path stays in `later`; rejects duplicate module name in `next` |

**Notes on identifiers**:

- Mutation path parameters expect MongoDB ObjectIds (`resource_id`, `path_id`).
- `module_name` path segment uses word pattern `^[^\s]{1,40}$` — **URL-encode** the segment in client requests when the name contains characters that are not path-safe.
- `JourneyCompleteInput` (from OpenAPI): optional `rating` (integer 1–4), `note` (string, max 4096), `duration` (ISO 8601 duration pattern).
- Journey `now[].resource_id` may be stored as a Resource name in some legacy rows; UI tasks must pass ObjectIds to mutation endpoints (see L119/L120).
- Promote mutations do **not** create Event documents (per OpenAPI descriptions).

## Goals

- **`src/api/types.ts`**:
  - Add `JourneyCompleteInput` aligned to OpenAPI.
- **`src/api/client.ts`**:
  - `advanceJourneyResource(resourceId: string): Promise<Journey>` → `PATCH /api/journey/advance/{resource_id}` (no body).
  - `completeJourneyResource(resourceId: string, data?: JourneyCompleteInput): Promise<Journey>` → `PATCH /api/journey/complete/{resource_id}` with optional JSON body.
  - `promoteJourneyPath(pathId: string): Promise<Journey>` → `PATCH /api/journey/promote/path/{path_id}` (no body).
  - `promoteJourneyModule(pathId: string, moduleName: string): Promise<Journey>` → `PATCH /api/journey/promote/module/{path_id}/{encodeURIComponent(moduleName)}` (no body).
- **`src/api/Journey.client.test.ts`**:
  - Unit tests for each implemented mutation method (mock `fetch`, assert URL, method, body, parsed `Journey` response).
  - Error handling parity with existing client tests (`ApiError`, 401, network failure).
- No Vue page or component changes in this task.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Unit tests**
  - `npm run test` — `Journey.client.test.ts` covers new mutation methods

- **Build**
  - `npm run build`

- **Dev verification**
  - `npm run api`
  - Optional manual `curl` against local mutations if seeded journey data supports it

- **Packaging verification**
  - `npm run container`

## Outputs

Paths are relative to **this SPA repository root**.

- `src/api/types.ts` — `JourneyCompleteInput`
- `src/api/client.ts` — `advanceJourneyResource`, `completeJourneyResource`, `promoteJourneyPath`, `promoteJourneyModule`
- `src/api/Journey.client.test.ts` — mutation client coverage

## Execution Notes
