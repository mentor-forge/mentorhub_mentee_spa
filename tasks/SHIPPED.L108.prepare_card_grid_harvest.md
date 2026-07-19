# L108 – Prepare the responsive card-grid harvest

**Status**: Shipped
**Type**: Feature  
**Depends On**: L107_refine_paths_card_layout  
**Description**: Capture the validated, reusable layout behavior as a focused handoff for adoption by `mentorhub_spa_utils`, while keeping Paths-specific presentation local.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — harvesting workflow and current `CardGrid` / `MhCard` contracts
- `../mentorhub_spa_utils/src/components/CardGrid.vue`
- `../mentorhub_spa_utils/src/components/MhCard.vue`
- `../mentorhub_spa_utils/tests/components/CardGrid.test.ts`
- `../mentorhub_spa_utils/tests/components/MhCard.test.ts`
- `README.md`
- `src/components/ResponsiveCardGrid.vue`
- `src/components/ResponsiveCardGrid.test.ts`
- `src/pages/PathsListPage.vue`
- `cypress/e2e/path.cy.ts`
- `tasks/PENDING.L106.prototype_equal_height_card_grid.md`
- `tasks/PENDING.L107.refine_paths_card_layout.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

## Goals

- Review the completed local prototype and Paths experiment results before proposing shared-library work.
- Create a task handoff that can be copied to the `mentorhub_spa_utils` issue/task workflow; do not edit that sibling repository from this SPA workflow.
- Scope the harvest to reusable layout behavior:
  - equal-width cards independent of content;
  - equal-height expanded cards within each row;
  - responsive growth through a maximum of eight columns;
  - preserved slot identity/keys and `automationId`;
  - an explicit, tested contract for collapsed cards.
- Exclude Paths-specific presentation decisions from the shared scope: `path.name`, `path.description`, status visibility, route actions, API behavior, and Paths automation IDs remain consumer concerns.
- Require the eventual shared implementation to update `CardGrid` tests, the cards dashboard/demo, and README documentation before publishing a new exact package version.
- Include a downstream migration outline: publish the shared package, bump this SPA's exact dependency, restore the package-root `CardGrid` import, remove the local prototype, and rerun the L106/L107 regression coverage.
- Record any behavior that could be a compatibility change from the current intrinsic-height/collapsed-card contract so the shared-library maintainer can make an explicit API decision.

## Testing Expectations

This is a documentation/handoff task; do not change runtime code.

- Confirm the handoff accurately reflects the verified behavior and test results recorded in L106 and L107.
- Confirm every proposed shared-library behavior is domain-independent.
- Confirm the handoff identifies shared demo, unit-test, documentation, release, and downstream migration expectations.
- No build or packaging commands are required because this task changes only a task handoff document.

## Outputs

Paths are relative to **this SPA repository root**.

**Create:**

- `tasks/ISSUE.mentorhub_spa_utils.harvest_responsive_card_grid.md` — validated shared-library handoff and downstream migration outline

The agent must not edit files outside this repository's `tasks/` folder and must not implement or publish the `mentorhub_spa_utils` change in this task.

## Execution Notes

### Plan
1. Review L106/L107 shipped results, local `ResponsiveCardGrid`, shared `CardGrid`/`MhCard` contracts, and harvesting workflow in spa_utils README.
2. Write `tasks/ISSUE.mentorhub_spa_utils.harvest_responsive_card_grid.md` scoped to reusable layout only (equal width/height, 1→8 cols, slot keys/`automationId`, collapsed contract); exclude Paths presentation.
3. Require spa_utils CardGrid tests, `/demo/dashboard` demo, and README updates before publish; outline mentee SPA migration (publish → exact dep bump → restore package `CardGrid` → delete local prototype → rerun L106/L107 regressions).
4. Record compatibility notes vs current VRow/VCol intrinsic-height / collapsed non-stretch contract so maintainers can choose an explicit API (replace defaults vs opt-in prop/mode).
5. Mark this task Shipped and rename to `SHIPPED.L108.prepare_card_grid_harvest.md`. No runtime code changes.

### What shipped
- Created `tasks/ISSUE.mentorhub_spa_utils.harvest_responsive_card_grid.md` — spa_utils handoff covering reusable layout scope, Paths exclusions, tests/demo/README/publish gates, mentee migration steps, and compatibility options (replace defaults vs opt-in vs new export) vs current intrinsic-height CardGrid.

### Validation
- Confirmed handoff matches L106/L107 verified behavior (CSS Grid 1→8, equal width/height expanded, collapsed non-stretch, slot/`automationId` contract).
- Confirmed shared behaviors are domain-independent; Paths presentation explicitly out of scope.
- Confirmed handoff requires CardGrid unit tests, dashboard demo, README, publish, and downstream mentee migration + regression rerun.
- No runtime code changes; no spa_utils edits; no build/packaging required.
