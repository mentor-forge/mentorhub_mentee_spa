# Harvest responsive equal-height CardGrid into spa_utils

## Summary

Promote the validated mentee SPA local prototype `ResponsiveCardGrid` into `@mentor-forge/mentorhub_spa_utils` as an evolution of shared `CardGrid`. Harvest **layout behavior only** — equal-width columns, equal-height expanded cards within a row, responsive growth through a maximum of eight columns, preserved slot identity/keys and `automationId`, and an explicit collapsed-card contract.

Do **not** harvest Paths-specific presentation (path name/description layout, status visibility, routes, API, or Paths automation IDs). Those remain consumer concerns in `mentorhub_mentee_spa`.

## Source of truth (validated in mentee SPA)

| Item | Location / result |
|------|-------------------|
| Local prototype | `mentorhub_mentee_spa/src/components/ResponsiveCardGrid.vue` |
| Unit tests | `mentorhub_mentee_spa/src/components/ResponsiveCardGrid.test.ts` (8 cases) |
| Paths experiment | `PathsListPage.vue` + `cypress/e2e/path.cy.ts` |
| L106 | Shipped — CSS Grid 1→8, equal-width/height expanded, collapsed non-stretch |
| L107 | Shipped — Paths consumes prototype; Cypress equal sizing + column progression 1→8 |
| Current shared `CardGrid` | `mentorhub_spa_utils/src/components/CardGrid.vue` — VRow/VCol, default breakpoints `cols=12 sm=6 md=4 lg=3`, columns use `align-self-start` (intrinsic height) |
| Current shared `MhCard` | Intrinsic height / `align-self: flex-start`; collapsed shrinks to title bar |

## In scope (shared library)

Domain-independent layout contract to adopt in spa_utils `CardGrid` (or an explicitly named successor exported as the preferred grid):

1. **Equal width** — every card in a row gets the same track width regardless of content (`minmax(0, 1fr)` / equal columns).
2. **Equal height (expanded)** — expanded cards in the same visual row stretch to the tallest sibling via grid stretch + scoped overrides of MhCard intrinsic-height rules **inside the grid only** (do not globally change `MhCard` defaults for non-grid use).
3. **Responsive columns 1→8 (max eight)** — documented fixed breakpoints (aligned with the prototype):

   | Columns | Min-width |
   |---------|-----------|
   | 1 | 0 |
   | 2 | 600px (sm) |
   | 3 | 960px (md) |
   | 4 | 1280px (lg) |
   | 5 | 1600px |
   | 6 | 1920px (xl) |
   | 7 | 2240px |
   | 8 | 2560px (xxl) — **never more than eight** |

4. **Slot contract** — flatten Fragment/`v-for` slot content; one grid item per card; preserve VNode `key` (fallback index); skip comment/null nodes.
5. **`automationId`** — apply `data-automation-id` on the grid root.
6. **Collapsed contract** — when a slotted `MhCard` has `.mh-card--collapsed`, it **must not** stretch to sibling row height; keep title-bar / intrinsic height (`align-self: flex-start`, `height: auto`, `flex: 0 0 auto`). Expanded cards stretch; collapsed cards do not.

Implementation note from the prototype: use **CSS Grid** (not Vuetify `VRow`/`VCol`) so column counts 5, 7, and 8 are expressible; a 12-column system cannot express those cleanly.

## Out of scope (consumer / Paths only)

Do **not** move these into spa_utils as part of this harvest:

- `path.name` as card title / dropping a `"Path"` prefix
- Description-only body copy and fallbacks (“No description provided.”)
- Status chip presence/absence or status automation IDs
- View/edit route actions and button icons
- List API filtering, search, load-more, or pagination
- Paths (or any journey) `data-automation-id` values
- Page-level `v-container fluid` / content-width choices (consumers must ensure their page allows the grid to grow past four columns)

## Compatibility notes (explicit API decision required)

The current published `CardGrid` + `MhCard` contract intentionally keeps **intrinsic height** and **collapsed non-stretch** via `align-self-start` on columns and MhCard `align-self: flex-start`. The prototype **changes expanded-card height behavior** inside the grid (stretch to row) while **preserving** collapsed non-stretch.

Maintainers must choose and document one approach before publishing:

| Option | Behavior | Impact |
|--------|----------|--------|
| **A. Replace `CardGrid` defaults** | CSS Grid 1→8 + equal-height expanded becomes the default `CardGrid` | Breaking visual change for existing dashboards that relied on intrinsic-height expanded cards and/or VCol breakpoint props (`cols`/`sm`/`md`/`lg`/`xl`) |
| **B. Opt-in mode / prop** | e.g. `equalHeight` / `layout="responsive"` keeps today’s VRow/VCol defaults; new behavior behind a prop | Additive; existing consumers unchanged until they opt in |
| **C. New export** | e.g. `ResponsiveCardGrid` alongside `CardGrid`, then deprecate old layout | Clear migration path; two APIs until cleanup |

Whichever option ships:

- Preserve collapsed non-stretch (aligned with current MhCard README: collapsed cards shrink to the title bar and do not stretch to sibling row height).
- If breakpoint props (`cols`/`sm`/`md`/`lg`/`xl`) are removed or ignored under the new layout, treat that as a **documented breaking or major API change**.
- Do not change `MhCard` global styles for pages that do not use the new grid; keep stretch overrides scoped to the grid (as in the prototype `:deep` rules).

## Required spa_utils work before publishing

1. **Implement** the harvested layout in `src/components/` (prefer evolving `CardGrid.vue` per the API decision above; export from package root / `./components`).
2. **Unit tests** — update `tests/components/CardGrid.test.ts` (and add cases as needed) for:
   - one wrapper/item per slotted card, including Fragment flattening and null/comment skip;
   - `automationId` on the root;
   - equal-width / stretch / max-eight column CSS contract (source or rendered contract tests mirroring the mentee Vitest suite);
   - expanded stretch vs collapsed non-stretch MhCard contract;
   - any retained or deprecated breakpoint props per the chosen API.
3. **Demo** — update `/demo/dashboard` (`demo/pages/DashboardPage.vue`) so the cards dashboard demonstrates equal-height rows, varied body lengths, and wide-viewport column growth (document how to verify 5–8 columns).
4. **README** — document the new `CardGrid` layout contract, breakpoints, collapsed behavior, and any breaking/opt-in API change under the MhCard / CardGrid / DataCard section; follow the existing [Harvesting a local control into spa_utils](../mentorhub_spa_utils/README.md#harvesting-a-local-control-into-spa_utils) workflow.
5. **Bump + publish** — minor for additive API, or major if defaults/breakpoint props break; publish exact semver to CodeArtifact. Do not publish until tests, demo, and README are updated.

## Downstream migration (`mentorhub_mentee_spa`)

After the shared package is published (exact version TBD by spa_utils release):

1. Run `mh` + bump `@mentor-forge/mentorhub_spa_utils` to the **exact** new semver in `package.json` / lockfile (`npm ci`).
2. Restore the package-root `CardGrid` import on `PathsListPage.vue` (replace local `ResponsiveCardGrid`), using whatever prop/default the harvest chose so Paths keeps equal-height + 1→8 behavior.
3. Delete local prototype files:
   - `src/components/ResponsiveCardGrid.vue`
   - `src/components/ResponsiveCardGrid.test.ts`
4. Adjust Cypress if class names change (today path.cy.ts asserts `.responsive-card-grid__item` / CSS Grid column counts); keep Paths presentation and automation IDs stable.
5. Rerun mentee regressions that validated L106/L107:
   - `npm run test`
   - `npm run build`
   - `npm run container`
   - `npm run service`
   - `npm run cypress:run` (path equal-height + 1→8 column cases)

## Suggested spa_utils planning prompts

- Harvest mentee `ResponsiveCardGrid` layout into `CardGrid` (CSS Grid 1→8, equal-width/height expanded, collapsed non-stretch); decide replace vs opt-in vs new export and document the compatibility impact.
- Extend `CardGrid` Vitest coverage for slot flattening, `automationId`, max-eight columns, and expanded/collapsed height contracts.
- Update `/demo/dashboard` and README CardGrid docs before publishing the next exact package version.
- Do not include Paths (or any journey) content, status, routing, or automation IDs in the shared component.

## Notes

- Copy this file into the `mentorhub_spa_utils` issue/task workflow; do not implement or publish from the mentee SPA orchestration.
- Until harvest ships, mentee SPA keeps the local thin duplicate (`ResponsiveCardGrid`) per harvesting guidance.
- Related mentee commits: L106 `f034e49`, L107 `1452f67` (branch `F-ES05-Path-List-Page-#7`).
