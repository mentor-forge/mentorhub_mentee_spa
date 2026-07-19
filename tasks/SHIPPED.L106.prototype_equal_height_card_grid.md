# L106 – Prototype an equal-height, wide-screen card grid

**Status**: Shipped
**Type**: Feature  
**Depends On**: L105_align_vitest_cypress_editors  
**Description**: Implement a local, reusable card-grid component that gives cards equal widths, stretches cards to the tallest content in each row, and scales responsively from one through eight columns.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — shared component conventions and harvesting guidance
- `../mentorhub_spa_utils/src/components/CardGrid.vue` — existing shared API and VRow/VCol implementation
- `../mentorhub_spa_utils/src/components/MhCard.vue` — existing intrinsic-height behavior that the local grid must deliberately override when expanded
- `../mentorhub_spa_utils/tests/components/CardGrid.test.ts`
- `../mentorhub_spa_utils/tests/components/MhCard.test.ts`
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

## Goals

- Add a local layout component under `src/components/` as a generic, domain-independent prototype suitable for later harvesting into `mentorhub_spa_utils`; this is a component rather than a composable because it owns rendered layout and styling.
- Preserve the useful `CardGrid` consumer contract: default slot, `automationId`, keyed slotted children, and responsive behavior without journey-specific data, API, or route knowledge.
- Give every card in a row the same available width regardless of its content.
- Stretch every expanded card in a row to the height of the card with the largest content in that row. Do not solve this with measured or hard-coded pixel heights.
- Define and document responsive column counts that progress from one column on narrow screens through four columns at normal desktop widths, then continue to five, six, seven, and a maximum of eight columns on increasingly wide screens.
- Ensure the layout can override the current shared `MhCard` intrinsic-height rules only within this grid, without globally changing `MhCard` or editing `mentorhub_spa_utils`.
- Preserve sensible collapsed-card behavior if the local grid is later used with collapsible cards; explicitly test or document whether a collapsed card stretches, since the current shared contract intentionally keeps collapsed cards at title-bar height.
- Keep the local component API and CSS free of Paths-specific naming so the prototype can be harvested mechanically after validation.

## Testing Expectations

Run all commands from **this SPA repository root**.

- Add focused Vitest coverage for:
  - one wrapper/grid item per slotted card, including `v-for` Fragment content;
  - stable propagation of `automationId`;
  - generic classes/styles that enforce equal-width columns, row stretching, and a maximum of eight columns;
  - the documented collapsed-card behavior.
- `npm run test`
- `npm run build`
- `npm run lint` if the script exists; otherwise record that it is unavailable.
- Packaging verification:
  - `npm run container`
  - `npm run service`
  - `npm run cypress:run`

## Outputs

Paths are relative to **this SPA repository root**.

**Create:**

- `src/components/ResponsiveCardGrid.vue` — local, harvest-ready equal-height responsive grid
- `src/components/ResponsiveCardGrid.test.ts` — component contract and layout-rule coverage

The agent must not edit `mentorhub_spa_utils`, change any page to consume the component, or modify shared `MhCard` in this task.

## Execution Notes

### Plan
1. Create `src/components/ResponsiveCardGrid.vue` as a harvest-ready local layout component mirroring `CardGrid`'s slot flattening / key-preserving render pattern, but using CSS Grid (not VRow/VCol) so column counts can progress through 1→8 (Vuetify's 12-col system cannot express 5/7/8 cleanly).
2. Document fixed responsive breakpoints in the component: 1@0, 2@600, 3@960, 4@1280, 5@1600, 6@1920, 7@2240, 8@2560 (max). Props: `automationId` only (+ default slot).
3. Equal-width via `1fr` tracks; equal-height expanded cards via grid stretch + scoped `:deep` overrides of `MhCard` intrinsic-height rules (`align-self`/`height`/`flex`) only inside this grid. Collapsed `.mh-card--collapsed` keeps title-bar height (`align-self: flex-start`).
4. Add co-located Vitest tests for wrapper-per-card (incl. Fragment), `automationId`, layout classes/CSS contract (max 8 cols, stretch, equal-width), and collapsed-card non-stretch contract.
5. Run `npm run test`, `npm run build`, note lint unavailable, then packaging (`container`, `service`, `cypress:run`).

### What shipped
- Created `src/components/ResponsiveCardGrid.vue` — CSS Grid layout, CardGrid-style VNode flattening, `automationId`, documented 1→8 column media queries, scoped MhCard height overrides for expanded vs collapsed cards.
- Created `src/components/ResponsiveCardGrid.test.ts` — 8 Vitest cases covering slots/Fragment/null, automationId, domain-free class names, CSS equal-width/stretch/max-8 contract, and collapsed non-stretch contract.

### Test results
- `npm run test` — **pass** (9 files / 50 tests, including 8 new ResponsiveCardGrid tests)
- `npm run build` — **pass**
- `npm run lint` — **unavailable** (no `lint` script in package.json)
- `npm run container` — **pass** (image `ghcr.io/mentor-forge/mentorhub_mentee_spa:latest`)
- `npm run service` — **pass after recovery**: initial `mh up mentee` failed because a leftover local Node process held `127.0.0.1:8394`; killed that listener, started `mentorhub-mentee_spa-1`, SPA returned HTTP 200
- `npm run cypress:run` — **pass** (19/19 across journey, navigation, path, resource)

### Notes for L107
- Import `ResponsiveCardGrid` from `@/components/ResponsiveCardGrid.vue` (or relative) and replace shared `CardGrid` on `PathsListPage` only.
- Documented wide-screen viewport for 8 columns is **2560px**; never exceeds 8.
- Expanded cards stretch within a row; collapsed MhCards intentionally do **not** stretch (title-bar height).
- Content-area width on Paths must allow the grid to grow past 4 columns (page/container constraint, not the grid component).
