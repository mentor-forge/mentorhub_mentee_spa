# L106 – Prototype an equal-height, wide-screen card grid

**Status**: Pending
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

Reserved for the execution agent to record plan, commands run, test results, and follow-ups.
