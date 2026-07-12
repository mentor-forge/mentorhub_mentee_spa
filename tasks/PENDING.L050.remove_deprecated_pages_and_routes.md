# L050 – Remove deprecated pages and routes

**Status**: Pending  
**Type**: Feature  
**Depends On**: none  
**Description**: Delete deprecated Event, Journey list/new, Note, and Rating page components and remove their router entries. Register `/journey` as the sole Journey route (pointing at `JourneyEditPage`) and make it the default landing page.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `src/router/index.ts` — current route table and auth/role guards
- `src/App.vue` — navigation drawer still links to routes being removed (updated in L060)

**Pages and routes to remove** (current state):

| Domain | Pages to delete | Routes to remove |
|--------|-----------------|------------------|
| Event | `EventNewPage`, `EventsListPage`, `EventViewPage` | `/events`, `/events/new`, `/events/:id` |
| Journey | `JourneyNewPage`, `JourneysListPage` | `/journeys`, `/journeys/new`, `/journeys/:id` |
| Note | `NoteNewPage`, `NoteEditPage`, `NotesListPage` | `/notes`, `/notes/new`, `/notes/:id` |
| Rating | `RatingNewPage`, `RatingEditPage`, `RatingsListPage` | `/ratings`, `/ratings/new`, `/ratings/:id` |

**Routes to keep** (unchanged in this task except Journey):

- `/resources`, `/resources/:id`
- `/paths`, `/paths/:id`
- `/admin`

## Goals

- All eleven deprecated page components under `src/pages/` are deleted.
- Router no longer registers list, new, or view routes for Event, Note, or Rating domains.
- Router no longer registers Journey list or new routes; `/journeys/:id` is replaced by a single `/journey` route.
- `JourneyEditPage.vue` is registered at path `/journey` with route name `Journey`.
- Root path `/` redirects to `/journey` (not `/journeys`).
- Role guard fallback (non-admin user hitting `/admin`) redirects to route name `Journey` instead of `Journeys`.
- Remaining routes (`/resources`, `/paths`, `/admin`) continue to work without change.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Install and static checks**
  - `npm run install` — refresh dependencies after changes (CodeArtifact auth; run `mh` first if needed)
  - `npm run lint` — format check

- **Build**
  - `npm run build` — compile sources; must succeed with no imports referencing deleted pages

- **Dev verification**
  - `npm run api` — start backing database and API containers (if not already running)
  - `npm run dev` — run dev server locally
  - Visiting `/`, `/events`, `/notes`, `/ratings`, `/journeys`, and `/journeys/new` should not render deleted pages (unknown routes or redirect to `/journey` as appropriate)
  - Visiting `/journey` should render `JourneyEditPage` (page behavior refined in L070)

- **Packaging verification**
  - `npm run container` — build the SPA container image
  - `npm run service` — run db + API + SPA containers

Note: Full unit and E2E test updates are in L080 and L090. This task may leave some tests failing until those tasks ship.

## Outputs

Paths are relative to **this SPA repository root**.

**Delete:**

- `src/pages/EventNewPage.vue`
- `src/pages/EventsListPage.vue`
- `src/pages/EventViewPage.vue`
- `src/pages/JourneyNewPage.vue`
- `src/pages/JourneysListPage.vue`
- `src/pages/NoteNewPage.vue`
- `src/pages/NoteEditPage.vue`
- `src/pages/NotesListPage.vue`
- `src/pages/RatingNewPage.vue`
- `src/pages/RatingEditPage.vue`
- `src/pages/RatingsListPage.vue`

**Update:**

- `src/router/index.ts` — remove deprecated routes; add `/journey` → `JourneyEditPage`; set `/` redirect and role-guard fallback to `Journey`

The agent must not update files outside this list.

## Execution Notes

_Reserved for the task execution agent._
