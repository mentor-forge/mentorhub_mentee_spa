# F138 – Pin `@mentor-forge/mentorhub_spa_utils@1.0.6` (CardGrid removal, DataCardGrid, MarkdownEditor)

**Status**: Shipped  
**Type**: Feature  
**Depends On**: _(none — first task in this wave)_  
**Description**: This repo owns the Mentee SPA **1.0.6 pin**. Bump `@mentor-forge/mentorhub_spa_utils` from exact `1.0.5` to exact **`1.0.6`**, refresh the lockfile from CodeArtifact, and align this SPA with the shipped 1.0.6 card and markdown contract. Package `CardGrid` is removed. Do not reintroduce list card dashboards. Do not add `marked` or `dompurify`. Cypress and packaging are **F139**.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — exact semver pins for shared packages; CodeArtifact (`mh` then `npm install`)
- `../mentorhub_spa_utils/README.md` — install pin **1.0.6**; **MhCard / DataCard / DataCardGrid**; **Type-aligned editors** (`markdown` / `MarkdownEditor`). Shared list `CardGrid` left the package in 1.0.6. List card dashboards belong to Discovery. `DataCardGrid` is a no-prop CSS Grid slot wrapper (`class="data-card-grid"`, hardcoded `data-automation-id="data-card-grid"`): 1 column below 641px, 2 from 641px, 4 from 1920px, 16px gap. It is not a Fragment flattener. `MarkdownEditor` props are unchanged (`field`, `modelValue`, `onSave`, `editable`, `visible`, `automationId`, `label`, `hint`, `rules`, `rows`). Resting view is sanitized GFM HTML (`marked` + `dompurify` bundled in spa_utils). Editable fields enter the textarea on click or Enter. Automation ids: root `automationId`, textarea `${automationId}-input`, display `${automationId}-display` when the prop does not already end in `-display` (no double `-display` suffix), value `markdown-field-display`. Package-root import pulls component CSS.
- `README.md` — currently documents spa_utils **1.0.5**. The components list still names `CardGrid` and `ListPageSearch`. The project layout already says this SPA has no CardGrid list dashboards and that collections live on Discovery.
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `package.json` / `package-lock.json` — currently `"@mentor-forge/mentorhub_spa_utils": "1.0.5"`; no `marked` or `dompurify`
- `src/App.vue` — `PageFrame` with `page-title="Mentee"` only plus `provideEditorConfig` (keep; do not add `navItems`, ALB URLs, or role tables)
- `src/pages/AdminPage.vue` — already imports `{ AdminPage }` from spa_utils and passes `GET /mentee/api/config` (do not fork Token / Config locally)
- `src/pages/JourneyEditPage.vue` — one parent `MhCard` (`journey-detail-card`) with vertically stacked `DataCard` sections: Now, Next, Later, Library, Administration. Nested module / topic / resource cards stay inside those sections. This is a single reading column, not a multi-column edit grid.
- `src/pages/PathViewPage.vue` — one parent `MhCard` (`path-view-card`). Description is read-only `SentenceEditor` (`path-view-description-display`). Modules and Administration are stacked `DataCard`s. Module and topic descriptions are plain text nodes, not `MarkdownEditor`.
- `src/components/JourneyPathEmbedCard.vue` — embedded path card; description is read-only `SentenceEditor`
- `src/components/JourneyProfileHeader.vue` — read-only `SentenceEditor` for profile `display_name` and notes (`journey-profile-notes-display`). Those are document fields, not token `display_name`, and they are not markdown.
- `src/components/ResourceViewCard.vue` — the only `MarkdownEditor` consumer. Resource `description` is read-only (`editable=false`, `field="description"`, automation id `${automationIdPrefix}-description-display`). Standalone resource page is `src/pages/ResourceViewPage.vue` wrapping this card. Aggregation and notes are sections inside the same `MhCard`, plus an admin-only `DataCard` when not embedded.
- `src/components/JourneyCompleteDialog.vue` — rating `v-rating` and notes `v-textarea` (`journey-complete-note`). Not `MarkdownEditor`.
- `src/main.ts` — no spa_utils stylesheet import; root imports in other modules already pull package CSS for Vite
- `vitest.config.ts` — inlines `@mentor-forge/mentorhub_spa_utils`; no version comment to update unless 1.0.6 changes the inline setting
- `cypress.config.ts` / `cypress/support/e2e.ts` — spa_utils Cypress subpaths `cypress/jwtDefaults`, `cypress/registerJwtSignTask`, `cypress/registerAuthCommands` (`visitPath: '/mentee/'`)

**Source issue**: first `mentorhub_mentee_spa` issue in the spa_utils **1.0.6** wave. This task delivers **the pin and local source/doc alignment**. Cypress markdown interaction and packaging are **F139**.

**External prerequisite**: `mentorhub_spa_utils` F050–F056 shipped and **`@mentor-forge/mentorhub_spa_utils@1.0.6` is published to CodeArtifact**. Vue `base` + SPA nginx prefix `/mentee/` and the catalog / `/mentee/config` Settings host are already shipped. Run `mh`, then `npm view @mentor-forge/mentorhub_spa_utils version`. If **1.0.6** is not available, set this task **Status** to `Blocked`, rename the file to `BLOCKED.F138.pin_spa_utils_1_0_6.md`, and stop — do not stay on `1.0.5` and do not point `package.json` at a git URL or sibling path.

This SPA **owns this repo’s pin**. Sibling SPAs pin independently; do not change other repos.

**Survey (planning time — reconfirm, do not assume a later edit added imports):**

- Zero imports of `CardGrid` from `@mentor-forge/mentorhub_spa_utils` in `src/**`. There is no local `CardGrid`, `DataCardGrid`, or `MarkdownEditor` component to delete.
- `src/**` does not import `ListPageSearch`. README still lists `CardGrid` and `ListPageSearch` as consumed components; that list is stale.
- Journey, path, and resource pages already use package `DataCard` / `MhCard` as a **vertical** detail flow (collapsed sections, nested modules, topics, and resources). They are not peer cards that should share a row. Wrapping Now / Next / Later / Library / Administration, path modules, or the resource card in `DataCardGrid` would place those sections in 2 columns from 641px and 4 from 1920px and break the journey reading order.
- The only markdown field is resource `description` on `ResourceViewCard`, already imported from spa_utils, read-only. Profile notes, path description, and the complete-resource note are `SentenceEditor` or a dialog `v-textarea`.
- Cypress `resource.cy.ts` asserts `contain.text` on `resource-view-description-display`. It does not type. Leave selector updates for F139.

**Out of scope**: Cypress specs (F139). Do not pass `navItems`, ALB origins, or role tables into `PageFrame`. Do not override logout locally. Do not fork `AdminPage`, `TokenClaimsCard`, or `PageFrame`. Do not rename, redirect, or delete journey, path, resource, or `/config` routes. Do not convert `SentenceEditor` fields or `journey-complete-note` into `MarkdownEditor`. Do not add a collection dashboard. Do not wrap the vertical journey / path / resource stacks in `DataCardGrid`.

### Wave ordering

Pin + local 1.0.6 alignment (F138) → Cypress confirmation and packaging (F139). Pinning first makes 1.0.6 `MarkdownEditor` resting view and `DataCardGrid` available before F139 checks selectors.

## Goals

- `package.json` pins `"@mentor-forge/mentorhub_spa_utils": "1.0.6"` — exact semver, **no caret**.
- `package-lock.json` resolves `1.0.6` from the CodeArtifact registry after `mh` and `npm install --include=dev`.
- `npm ls @mentor-forge/mentorhub_spa_utils` reports `1.0.6`.
- `package.json` does **not** gain `marked` or `dompurify` (or any other markdown renderer). Those libraries stay bundled inside spa_utils.
- There are zero imports of `CardGrid` from `@mentor-forge/mentorhub_spa_utils`. If a later edit added one, delete that import and the layout that depended on it. Do not replace it with a list card dashboard.
- Journey, path, and resource pages stay a single reading column of package `MhCard` / `DataCard`. Do not wrap Now, Next, Later, Library, Administration, path modules, embedded path cards, or the resource card in `DataCardGrid`. Do not add a page whose only purpose is to consume `DataCardGrid`.
- If implementation discovers a local page that already lays out several **peer** edit/detail cards with ad-hoc markup (not the vertical journey narrative above), replace that layout with package `DataCardGrid` + `DataCard` (no props on the grid; children authored in the slot; root class `data-card-grid`; hardcoded `data-automation-id="data-card-grid"`). Do not pass breakpoint props. Do not flatten Fragments. Do not use it as a list dashboard. Planning-time survey found no such page.
- Keep the existing `MarkdownEditor` import and props on `ResourceViewCard` (`field`, `editable=false`, `automationId` already ending in `-description-display`, `label`). Resting view becomes sanitized rendered markdown from spa_utils 1.0.6. Do not install `marked` or `dompurify`. Do not make the field editable. Do not change the automation id unless `vue-tsc` fails. 1.0.6 keeps a display id that already ends in `-display` (no double suffix) and puts rendered HTML in `markdown-field-display`.
- Do not convert path description, profile notes, module/topic description text, or `JourneyCompleteDialog` notes into `MarkdownEditor`.
- The app still builds and unit-tests: `PageFrame` still receives only `pageTitle` (`page-title="Mentee"`). Keep `provideEditorConfig`. IdP bootstrap / `urlAuthBootstrap` / `redirectToIdpLogin` stay as today. Logout `return_to` remains owned by spa_utils.
- `README.md` names the pinned version **1.0.6**. Drop package `CardGrid` and `ListPageSearch` from the consumed-components list. Keep the existing statement that this SPA has no list card dashboards and that collections stay on Discovery (`/discovery/paths`, `/discovery/resources`). State that multi-card **peer** edit/detail layout would use package `DataCardGrid` / `DataCard` (this SPA’s journey, path, and resource pages stay a vertical `DataCard` column; none use `DataCardGrid`). State that resource description uses package `MarkdownEditor` and that the resting view is owned by spa_utils (this SPA does not depend on `marked` or `dompurify`). Keep existing `/mentee/config` Settings host wording and Token / chrome `display_name` facts (`admin-token-display-name-display`, `nav-profile-name-display`), updated to say they are owned by spa_utils **1.0.6**.
- Fix any `src/**` import or type breakage from 1.0.6. Do not add, rename, or delete routes. Keep existing journey, path, resource, and `/config` pages and the existing `AdminPage` wrapper.
- `vitest.config.ts` may be touched **only** if 1.0.6 changes whether the package must be inlined for Vitest. Do not change coverage thresholds.
- The three spa_utils Cypress subpath imports still resolve under 1.0.6. If a subpath or option name moved, update the import here — do **not** vendor a local copy. Do not rewrite Cypress specs here.

### Craftsmanship Expectations

- Reuse `mentorhub_spa_utils` for shared SPA behavior rather than creating local equivalents.
- Treat DRY as avoiding duplicated knowledge: card chrome and markdown rendering are owned by 1.0.6 `DataCard` / `DataCardGrid` / `MarkdownEditor`. Do not grow a local card grid or a local markdown renderer.
- Keep journey-specific behavior in this SPA (journey / path / resource detail, rating and note completion). Discovery owns list collections.
- Prefer deleting a `CardGrid` import over replacing it. Do not invent a list dashboard because the export disappeared.
- Do not introduce local workarounds that reimplement `DataCardGrid` columns or sanitize markdown in this repo.
- Do not widen sentence fields (max 255, no tabs or newlines) or the complete-dialog textarea into markdown (max 4096, rendered GFM) just to exercise the new resting view.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `mh` (CodeArtifact auth) then `npm install --include=dev`
- `npm ls @mentor-forge/mentorhub_spa_utils` — confirm **1.0.6**
- Confirmation searches:
  - `rg 'CardGrid' src cypress package.json README.md` — zero component imports; README may mention the removal
  - `rg 'marked|dompurify' package.json package-lock.json src` — zero direct dependencies (lockfile hits only inside the spa_utils tarball are acceptable)
  - `rg 'MarkdownEditor' src` — only `ResourceViewCard.vue` (existing read-only description)
  - `rg 'DataCardGrid' src` — zero, unless a pre-existing peer multi-card page was migrated in this task
  - `rg "from '@mentor-forge/mentorhub_spa_utils'" src cypress.config.ts cypress/support` — every import still resolves
- `npm run test` — full Vitest suite, including `src/App.test.ts`
- `npm run test:coverage` — the `src/api/**`, `src/composables/**`, and `src/components/**` thresholds in `vitest.config.ts` must still hold. Pre-existing threshold misses recorded in F128 / F133 / F136 / F137 are not a reason to change `vitest.config.ts`; record them in Execution Notes if they persist unchanged.
- `npm run build` — `vue-tsc` must be clean. **This repo defines no `lint` script**, so `npm run build` is the type gate. Do not add a lint script in this task.

Do **not** run `npm run cypress:run` in this task. Resource description Cypress still targets the pre-1.0.6 display node. Leave selector checks and packaging to F139. Do not “fix” Cypress here unless a Cypress helper import fails to compile.

Packaging (`npm run container` / `npm run service`) is **F139**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `package.json` — `"@mentor-forge/mentorhub_spa_utils": "1.0.6"`; do not add `marked` or `dompurify`
- `package-lock.json` — resolved 1.0.6 from CodeArtifact
- `README.md` — spa_utils version note **1.0.6**; drop consumed `CardGrid` and `ListPageSearch`; collections stay on Discovery; `DataCardGrid` / `DataCard` contract for peer multi-card edit/detail (journey / path / resource stay a vertical column; none use the grid); resource description `MarkdownEditor` resting view owned by spa_utils; keep existing `/mentee/config` Settings host wording and Token / chrome `display_name` ids

**Update only if 1.0.6 breaks compile or a `CardGrid` import is found:**

- Any `src/**` file that imported `CardGrid` — delete the import and the dependent layout; do not add a list dashboard
- Any local page that already lays out several **peer** edit/detail cards — switch that layout to package `DataCardGrid` + `DataCard`. Do not apply this to `JourneyEditPage`, `PathViewPage`, `JourneyPathEmbedCard`, or `ResourceViewCard`
- `vitest.config.ts` — only if 1.0.6 requires a change to the inline setting
- `cypress.config.ts`, `cypress/support/e2e.ts` — only if a spa_utils Cypress subpath or option moved in 1.0.6
- Any other `src/**` import or type that fails to compile against 1.0.6

Do not change journey, path, resource, or `/config` routes. Do not pass disallowed `PageFrame` props. Do not change Cypress specs in this task unless a compile of test helpers breaks. Do not change `src/router/index.ts`, `vite.config.ts`, `nginx.conf.template`, or `Dockerfile`. Do not change `ResourceViewCard` editor type or automation id, `SentenceEditor` fields, or `JourneyCompleteDialog`. Do not rename profile, path, or resource fields. Do not add `src/main.ts` stylesheet import unless the production build proves package CSS is missing.

## Execution Notes

### Plan
1. Confirmed `@mentor-forge/mentorhub_spa_utils@1.0.6` is published on CodeArtifact (`mh` + `npm view` → `1.0.6`).
2. Pin `package.json` dependency to exact `"1.0.6"` (no caret); run `npm install --include=dev` to refresh lockfile.
3. Update `README.md` to document 1.0.6: drop consumed `CardGrid` / `ListPageSearch`; note Discovery owns collections; document `DataCardGrid` / `DataCard` peer-card contract (this SPA stays vertical; no `DataCardGrid` usage); note resource `MarkdownEditor` resting view owned by spa_utils (no local `marked`/`dompurify`); bump Token/chrome display_name ownership to 1.0.6.
4. Survey reconfirmed: zero `CardGrid` / `DataCardGrid` imports in `src/**`; `MarkdownEditor` only on `ResourceViewCard` (read-only). No src layout changes planned unless compile fails.
5. Run Testing Expectations (ls, confirmation `rg`, test, coverage, build). Do not run Cypress, container, or service. Leave Status Pending.

### Summary
Pin succeeded. `@mentor-forge/mentorhub_spa_utils` is exact **1.0.6** in `package.json` / lockfile. README aligned to 1.0.6 card/markdown contract. No `src/**` changes required (no `CardGrid` imports; vertical journey/path/resource layouts left alone; ResourceViewCard MarkdownEditor unchanged). No `marked`/`dompurify` added. Status left **Pending** for orchestrator commit/ship.

### Files changed
- `package.json` — pin `"@mentor-forge/mentorhub_spa_utils": "1.0.6"`
- `package-lock.json` — resolved 1.0.6 from CodeArtifact (transitive `marked`/`dompurify` nested under spa_utils only)
- `README.md` — version note 1.0.6; dropped consumed `CardGrid`/`ListPageSearch`; DataCardGrid peer-card contract; MarkdownEditor resting view; Token/chrome display_name ownership 1.0.6
- `tasks/PENDING.F138.pin_spa_utils_1_0_6.md` — this Execution Notes update

### Intentionally not changed
- All `src/**` (App.vue, JourneyEditPage, PathViewPage, ResourceViewCard, JourneyPathEmbedCard, JourneyCompleteDialog, JourneyProfileHeader, AdminPage, router, main.ts)
- `vitest.config.ts` (thresholds unchanged; inline still correct)
- Cypress specs / `cypress.config.ts` / `cypress/support/e2e.ts` (subpaths still resolve)
- No lint script added

### Commands and results
1. `mh` — CodeArtifact auth refreshed
2. `npm view @mentor-forge/mentorhub_spa_utils version` → **1.0.6** (published)
3. `npm install --include=dev` — ok (added 3 packages / changed 1)
4. `npm ls @mentor-forge/mentorhub_spa_utils` → `@mentor-forge/mentorhub_spa_utils@1.0.6`
5. Confirmation searches:
   - `rg 'CardGrid' src cypress package.json README.md` — zero component imports; README mentions removal/non-use only
   - `rg 'marked|dompurify' package.json package-lock.json src` — zero in `package.json`/`src`; lockfile hits only nested spa_utils transitive deps (acceptable)
   - `rg 'MarkdownEditor' src` — only `ResourceViewCard.vue`
   - `rg 'DataCardGrid' src` — zero matches
   - `rg "from '@mentor-forge/mentorhub_spa_utils'" src cypress.config.ts cypress/support` — all existing imports present (Cypress helpers use `/cypress/...` subpaths and still resolve)
6. `npm run test` — **10 files, 48 tests passed**
7. `npm run test:coverage` — **48 tests passed**; exit 1 from **pre-existing** threshold misses (unchanged; did not edit `vitest.config.ts`):
   - `src/composables/**` functions 88.88% < 90%; branches 54.76% < 60%
   - `src/components/**` lines 0% < 90%; statements 0% < 90%
8. `npm run build` — **passed** (`vue-tsc` clean + Vite production build)

### Blocker
None.

### Orchestrator confirmation
Re-ran `npm ls` (`@mentor-forge/mentorhub_spa_utils@1.0.6` from CodeArtifact), CardGrid / marked / MarkdownEditor / DataCardGrid searches, `npm run test:coverage` (48 passed; pre-existing composables and components threshold misses unchanged; `src/api/**` still 97 / 82.6 / 100 / 97), and `npm run build` (vue-tsc clean). Cypress subpaths unchanged. Marked shipped.
