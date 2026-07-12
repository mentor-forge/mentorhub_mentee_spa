# L090 – Update E2E and navigation tests

**Status**: Pending  
**Type**: Feature  
**Depends On**: L060_update_navigation_drawer, L070_repoint_journey_as_default_page, L080_cleanup_api_client_removed_domains  
**Description**: Remove Cypress E2E tests for deprecated domains and rewrite navigation and Journey tests for the simplified drawer and token-scoped Journey page.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `cypress/e2e/navigation.cy.ts` — asserts deprecated domain sections and links
- `cypress/e2e/journey.cy.ts` — list, new, create, search, and back-to-list flows
- `cypress/e2e/event.cy.ts`
- `cypress/e2e/note.cy.ts`
- `cypress/e2e/rating.cy.ts`
- `cypress/e2e/path.cy.ts` — retain; Paths remain in navigation
- `cypress/e2e/resource.cy.ts` — retain; Resources remain in navigation
- `src/App.vue` — updated drawer automation ids (L060)
- `src/pages/JourneyEditPage.vue` — token-scoped Journey page (L070)

**External prerequisite**: Same as L070 — `GET /api/journey` must be available on the running Mentee API for Journey E2E to pass against `npm run service`.

## Goals

- `cypress/e2e/event.cy.ts`, `cypress/e2e/note.cy.ts`, and `cypress/e2e/rating.cy.ts` are deleted.
- `cypress/e2e/navigation.cy.ts` asserts the simplified drawer:
  - Opens via `nav-drawer-toggle`
  - Shows Journey, Paths, Resources links
  - Shows Admin link only when logged in with `admin` role
  - Shows Logout link
  - Does **not** assert removed domain sections or links
  - Navigates to Paths and Resources from drawer
  - Closes drawer after navigation
- `cypress/e2e/journey.cy.ts` covers the token-scoped Journey page at `/journey`:
  - Default route `/` or nav Journey link lands on Journey page
  - Journey content loads (use automation ids from `JourneyEditPage`)
  - Editable field auto-save works for at least one PATCH field supported by the page
  - No tests visit `/journeys`, `/journeys/new`, or assert list/search/create flows
- `cypress/e2e/path.cy.ts` and `cypress/e2e/resource.cy.ts` continue to pass without modification unless broken by navigation changes (fix only if needed).
- `npm run cypress:run` passes against `npm run service`.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Install**
  - `npm run install`
  - `npx cypress install` — if Cypress binaries are missing

- **Unit tests** (regression)
  - `npm run test`

- **Build**
  - `npm run build`

- **E2E**
  - `npm run api` — if stack not already running
  - `npm run service` — db + API + SPA containers
  - `npm run cypress:run` — all remaining E2E specs pass

- **Packaging verification**
  - `npm run container`

## Outputs

Paths are relative to **this SPA repository root**.

**Delete:**

- `cypress/e2e/event.cy.ts`
- `cypress/e2e/note.cy.ts`
- `cypress/e2e/rating.cy.ts`

**Update:**

- `cypress/e2e/navigation.cy.ts` — simplified drawer assertions and navigation flows
- `cypress/e2e/journey.cy.ts` — token-scoped Journey page coverage only

The agent must not update files outside this list unless `path.cy.ts` or `resource.cy.ts` require a minimal fix to pass after navigation changes; if so, list those files in **Execution Notes** and limit edits to broken assertions only.

## Execution Notes

_Reserved for the task execution agent._
