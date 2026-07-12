# L070 – Repoint Journey as default page

**Status**: Shipped  
**Type**: Feature  
**Depends On**: L050_remove_deprecated_pages_and_routes  
**Description**: Adapt `JourneyEditPage` to be the token-scoped default Journey view at `/journey`, aligned with the updated Mentee API contract (get-or-create by `profile_id`, no list or create flows).

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `src/pages/JourneyEditPage.vue` — currently loads journey by route param `:id` and links back to list
- `src/api/client.ts` — `getJourneys`, `createJourney`, `getJourney(id)`, `updateJourney(id, …)`
- `src/api/types.ts` — legacy `Journey` shape with `name`/`description`

**External prerequisite**: The running Mentee API exposes token-scoped Journey read at `GET /api/journey` (get-or-create for the authenticated user's `profile_id`) and no longer documents list or create Journey endpoints. Confirm before starting:

```bash
curl -X GET "http://localhost:8393/docs/openapi.yaml"
```

Look for `GET /api/journey` returning a single `Journey` document and absence of `GET /api/journey` list pagination or `POST /api/journey` create. If the contract is not yet available, set **Status** to `Blocked` and stop.

Fetch a live Journey response for type alignment:

```bash
curl -X GET "http://localhost:8393/api/journey" -H "Authorization: Bearer <token>"
```

## Goals

- `JourneyEditPage` loads the authenticated user's Journey via a token-scoped API call (no route `:id` parameter).
- Page no longer shows a "Back to List" button or any navigation to removed Journey list/new routes.
- `src/api/client.ts` provides `getMyJourney()` calling `GET /api/journey` (or equivalent single-document read).
- `getJourneys` and `createJourney` are removed from the client (list/create pages deleted in L050).
- `updateJourney` uses the `_id` from the loaded Journey document (PATCH `/api/journey/{id}` or token-scoped PATCH as defined in the running OpenAPI).
- `src/api/types.ts` `Journey`, `JourneyUpdate` interfaces align with the running OpenAPI `Journey` schema (remove legacy `name`/`description` if absent from contract; add dictionary fields such as `profile_id`, `library`, `now`, `next`, `later` as required by OpenAPI).
- `JourneyEditPage` UI reflects the current Journey fields from OpenAPI (retain `AutoSaveField`/`AutoSaveSelect` patterns from `spa_utils` where PATCH is supported).
- Vue Query keys use `['journey']` for the singleton document fetch.
- Visiting `/` or `/journey` shows the Journey page for an authenticated user.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Install and static checks**
  - `npm run install`
  - `npm run lint`

- **Unit tests**
  - `npm run test` — Journey client tests updated in L080; may require that task to pass fully

- **Build**
  - `npm run build`

- **Dev verification**
  - `npm run api`
  - `npm run dev`
  - Log in and visit `/` — should land on Journey edit view with data from `GET /api/journey`
  - Confirm auto-save PATCH still works for editable fields

- **Packaging verification**
  - `npm run container`
  - `npm run service`
  - `npm run cypress:run` — journey E2E updated in L090

## Outputs

Paths are relative to **this SPA repository root**.

- `src/pages/JourneyEditPage.vue` — token-scoped load; remove list back-navigation; align fields with OpenAPI
- `src/api/client.ts` — add/replace Journey methods for singleton get-or-create read; remove list/create methods
- `src/api/types.ts` — align `Journey` and `JourneyUpdate` with running OpenAPI; remove `JourneyInput` if create is removed

The agent must not update files outside this list.

## Execution Notes

- Confirmed `GET /api/journey` on running API (F-EA03 shipped).
- Added `api.getMyJourney()`; removed list/create journey methods.
- Aligned `Journey`/`JourneyUpdate` types with OpenAPI (`profile_id`, `library`, `now`, `next`, `later`; PATCH supports `status` only).
- `JourneyEditPage` loads via `['journey']` query; shows status (auto-save), profile_id, scope counts, breadcrumbs; removed back-to-list.
