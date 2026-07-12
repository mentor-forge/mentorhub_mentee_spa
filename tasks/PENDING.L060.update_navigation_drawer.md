# L060 – Update navigation drawer

**Status**: Pending  
**Type**: Feature  
**Depends On**: L050_remove_deprecated_pages_and_routes  
**Description**: Replace the multi-domain navigation drawer with a flat menu containing only Journey, Paths, Resources, and Admin (plus Logout).

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `src/App.vue` — current drawer with per-domain subheaders and list/new links
- `src/router/index.ts` — route paths after L050 (`/journey`, `/paths`, `/resources`, `/admin`)
- `src/composables/useRoles.ts` — `hasRole('admin')` gating for Admin link

**Target navigation items:**

| Label | Route | Notes |
|-------|-------|-------|
| Journey | `/journey` | Default landing page (`JourneyEditPage`) |
| Paths | `/paths` | `PathsListPage` |
| Resources | `/resources` | `ResourcesListPage` with search |
| Admin | `/admin` | Visible only when user has `admin` role |
| Logout | (action) | Existing `handleLogout` behavior in append slot |

Remove all domain subheaders (`JOURNEY DOMAIN`, `RATING DOMAIN`, etc.), dividers between deprecated sections, and list/new link pairs.

## Goals

- Navigation drawer shows exactly four primary links (Journey, Paths, Resources, Admin) plus Logout.
- No drawer links reference removed routes (`/events`, `/notes`, `/ratings`, `/journeys`, `/journeys/new`).
- Journey link targets `/journey`.
- Admin link remains gated by `hasAdminRole` (`hasRole('admin')`).
- Logout remains in the drawer append slot with existing IdP redirect behavior.
- Drawer still closes on route change (`router.afterEach`).
- Each nav item has a `data-automation-id` following `{domain}-{element}` convention:
  - `nav-journey-link`
  - `nav-paths-link`
  - `nav-resources-link`
  - `nav-admin-link` (retain existing id)
  - `nav-logout-link` (retain existing id)
  - `nav-drawer-toggle` (retain existing id on hamburger)

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Install and static checks**
  - `npm run install`
  - `npm run lint`

- **Build**
  - `npm run build`

- **Dev verification**
  - `npm run api`
  - `npm run dev`
  - Open drawer and confirm only Journey, Paths, Resources, Admin (when admin), and Logout are visible
  - Click each link and confirm navigation to the correct route

- **Packaging verification**
  - `npm run container`
  - `npm run service`
  - `npm run cypress:run` — navigation E2E updated in L090; may fail until that task ships

## Outputs

Paths are relative to **this SPA repository root**.

- `src/App.vue` — simplified `v-navigation-drawer` list with four primary items and append-slot Admin/Logout

The agent must not update files outside this list.

## Execution Notes

_Reserved for the task execution agent._
