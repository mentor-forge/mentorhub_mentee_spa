# L080 – Cleanup API client for removed domains

**Status**: Pending  
**Type**: Feature  
**Depends On**: L070_repoint_journey_as_default_page  
**Description**: Remove Event, Note, and Rating types and client methods that supported deleted pages. Update Journey unit tests for the singleton Journey contract.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `src/api/client.ts` — Event, Note, Rating CRUD methods to remove
- `src/api/types.ts` — Event, Note, Rating interfaces to remove
- `src/api/Journey.client.test.ts` — tests for `getJourneys`, `createJourney` to replace
- `src/api/Event.client.test.ts`
- `src/api/Note.client.test.ts`
- `src/api/Rating.client.test.ts`

No remaining page or route should import Event, Note, or Rating client methods after L050.

## Goals

- `src/api/types.ts` no longer exports `Event`, `EventInput`, `Note`, `NoteInput`, `NoteUpdate`, `Rating`, `RatingInput`, or `RatingUpdate` interfaces.
- `src/api/client.ts` no longer exports methods for Event, Note, or Rating domains.
- `src/api/Journey.client.test.ts` covers `getMyJourney` (or equivalent) and `updateJourney` for the singleton Journey; list and create tests are removed.
- Deprecated domain client test files are deleted.
- `npm run test` passes for all remaining unit tests in `src/api/`.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Install and static checks**
  - `npm run install`
  - `npm run lint`

- **Unit tests**
  - `npm run test` — all Vitest tests pass

- **Build**
  - `npm run build`

- **Packaging verification**
  - `npm run container`
  - `npm run service`

## Outputs

Paths are relative to **this SPA repository root**.

**Delete:**

- `src/api/Event.client.test.ts`
- `src/api/Note.client.test.ts`
- `src/api/Rating.client.test.ts`

**Update:**

- `src/api/client.ts` — remove Event, Note, Rating methods (if any remain after L070)
- `src/api/types.ts` — remove Event, Note, Rating types (if any remain after L070)
- `src/api/Journey.client.test.ts` — singleton Journey read and PATCH coverage

The agent must not update files outside this list.

## Execution Notes

_Reserved for the task execution agent._
