# L121 – E2E coverage for Journey detail page sections and mutations

**Status**: Shipped  
**Type**: Feature  
**Depends On**: L120_journey_scope_action_buttons  
**Description**: Extend `cypress/e2e/journey.cy.ts` with fixtures and assertions for the restructured Journey detail layout, lazy section expansion, and all Journey mutation flows (Promote Path, Promote Module, Advance, Done).

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `src/pages/JourneyEditPage.vue` — L119/L120 final layout and automation ids
- `src/components/JourneyPathEmbedCard.vue` — L118
- `src/components/JourneyCompleteDialog.vue` — L120
- `cypress/e2e/journey.cy.ts` — existing status-edit coverage
- `cypress/e2e/path.cy.ts` — nested path/layout intercept patterns (L116)
- `cypress/e2e/resource.cy.ts` — resource embed / aggregation patterns
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

**OpenAPI (definitive)**:

```bash
curl -X GET "http://localhost:8393/docs/openapi.yaml"
```

**Mutation endpoints under test**:

| Action | Intercept pattern |
|--------|-------------------|
| Promote Path | `PATCH **/api/journey/promote/path/*` |
| Promote Module | `PATCH **/api/journey/promote/module/*/*` |
| Advance | `PATCH **/api/journey/advance/*` |
| Complete | `PATCH **/api/journey/complete/*` |

**Fixture guidance**:

- Intercept `GET **/api/journey` with a `Journey` body containing representative `later[]`, `next[]` (modules/topics/resource ids), `now[]`, and `library[]` entries.
- Stub `GET **/api/path/*` for Later path embed expansion (nested `PathDetail` with at least two modules for module-promote scenario).
- Stub `GET **/api/resource/*` and optional `GET **/api/aggregation/*` for resource embed expansion.
- Return updated `Journey` bodies from PATCH intercepts to simulate scope changes (path removed from `later`, module appended to `next`, resource moved between scopes).

## Goals

- **`cypress/e2e/journey.cy.ts`**:
  - **Layout**: Assert single top-level Journey card is visible and **not** collapsible (no collapse control on top card; status field always visible).
  - **Sections**: Assert Later / Next / Now / Library section cards exist, start **collapsed**, and expand to show nested content.
  - **Later**: Expand section → expand path embed → assert lazy path loading indicator then path description or module card; assert **no** edit/plus/delete controls.
  - **Next / Now**: Expand section → expand resource embed → assert resource field automation ids; expand Aggregation sub-card triggers lazy load (stub aggregation).
  - **Promote Path**: Click Promote Path on Later path card → wait for `PATCH **/api/journey/promote/path/*` with correct `path_id` → assert Later section updates (path removed or journey re-fetched).
  - **Promote Module**: Expand path → click Promote Module on a module card → wait for `PATCH **/api/journey/promote/module/{path_id}/{module_name}` → assert Next section reflects new module (via re-intercepted GET or DOM).
  - **Advance**: Click Advance on a Next resource → wait for `PATCH **/api/journey/advance/*` → assert request path includes resource id; UI reflects move toward Now.
  - **Done**: Click Done on Now resource → complete dialog visible → set rating + note → confirm → wait for `PATCH **/api/journey/complete/*` with body containing `rating` and `note`; dialog closes.
  - Preserve existing **status edit** and **navigation** tests; update selectors only where automation ids intentionally changed in L119/L120.
  - Admin: optional assertion that Administration card is present for admin persona and collapsed by default.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Unit tests**
  - `npm run test`

- **Build**
  - `npm run build`

- **E2E**
  - `npm run service`
  - `npm run cypress:run -- --spec cypress/e2e/journey.cy.ts`

- **Packaging verification**
  - `npm run container`
  - `npm run service`
  - `npm run cypress:run -- --spec cypress/e2e/journey.cy.ts`

## Outputs

Paths are relative to **this SPA repository root**.

- `cypress/e2e/journey.cy.ts` — Journey detail layout, lazy expansion, mutation flows

## Execution Notes
