# F139 – 1.0.6 Cypress confirmation and packaging

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F138_pin_spa_utils_1_0_6`  
**Description**: Confirm Cypress still matches spa_utils **1.0.6** `MarkdownEditor` resting view and editor behavior, and run the packaged SPA as the acceptance gate for the Mentee 1.0.6 pin. The only markdown field is read-only resource description. Do not invent an editable markdown field. Do not change the pin.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — E2E covers pages; automation ids are a stable UI API
- `../mentorhub_spa_utils/README.md` — `MarkdownEditor` resting view is sanitized rendered markdown. Editable fields enter the textarea on click or Enter. Textarea automation id is `${automationId}-input`; display is `${automationId}-display` (no double `-display` suffix when the prop already ends in `-display`); value node is `markdown-field-display`. `SentenceEditor` still renders its display while read-only (it is not click-to-edit and it is not markdown). `DataCardGrid` automation id is the hardcoded `data-card-grid`. `CardGrid` is gone.
- `README.md` — after F138 should name spa_utils **1.0.6**
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `tasks/PENDING.F138.pin_spa_utils_1_0_6.md` (or shipped successor) — pin already done; use Execution Notes if any local layout or import changed
- `cypress.config.ts` — `baseUrl` stays `http://localhost:8394`
- `cypress/support/e2e.ts` — `registerAuthCommands({ visitPath: '/mentee/' })`
- `cypress/support/commands.ts` — `visitPrefixed` only
- `cypress/e2e/resource.cy.ts` — `/mentee/resource/{id}`. Asserts `contain.text` of a 500-character plain description on `resource-view-description-display`. That id is the read-only `MarkdownEditor` automation id on `ResourceViewCard` (the prop already ends in `-display`). The spec does not type. 1.0.6 renders that string as sanitized HTML inside `markdown-field-display`.
- `cypress/e2e/journey.cy.ts` — journey detail. Profile notes use `journey-profile-notes-display` (`SentenceEditor`, read-only). The complete-resource flow types into `journey-complete-note`, a dialog `v-textarea` that is visible without a prior click. That is not `MarkdownEditor`.
- `cypress/e2e/path.cy.ts` — path detail. Module and topic descriptions are plain text nodes (`path-view-module-0-description-display`, `path-view-module-0-topic-0-description-display`). Path description is read-only `SentenceEditor`. The spec does not type into a markdown textarea.
- `cypress/e2e/navigation.cy.ts` — Token tab and PageFrame chrome `display_name` coverage from the 1.0.3/1.0.5 wave; keep
- `cypress/e2e/deployment.cy.ts` — nginx prefix / API proxy; keep unless a selector breaks
- `src/components/ResourceViewCard.vue` — only `MarkdownEditor`; `editable` is false
- `src/components/JourneyCompleteDialog.vue` — `v-textarea` `journey-complete-note`
- `src/pages/AdminPage.vue` — packaged `AdminPage` pass-through

Cypress runs against **8394**. Collection hamburger `href`s from `buildJourneyUrl` still include **`:8080`**. **Settings is the exception:** `hostingConfigHref()` stays on the current origin (`http://localhost:8394/mentee/config`).

`npm run dev` and `npm run service` both bind host port **8394**. Cypress runs against `npm run service`.

`cy.login()` with no argument seeds an **admin** token. Use `cy.login(['mentee'])` for mentee pages and `cy.login(['admin'])` for Settings. Do **not** change the spa_utils pin in this task. Do **not** add `marked` or `dompurify`.

**Survey (planning time):** no Cypress spec types into a markdown textarea. `resource.cy.ts` only reads the read-only description display. `journey.cy.ts` types into an always-visible dialog `v-textarea`. No spec targets `CardGrid` or `data-card-grid`. The click-or-Enter-then-`${automationId}-input` rule applies only if a spec is typing into `MarkdownEditor` without opening edit mode.

## Goals

- Reconfirm there is no Cypress use of `CardGrid` or `data-card-grid`. Do not add a markdown field, a card grid page, or a spec whose only purpose is to exercise edit mode.
- Resource description stays read-only. `resource.cy.ts` must still see the plain description string after 1.0.6 renders it as sanitized HTML. Prefer keeping `contain.text` on `resource-view-description-display`. If that `cy.get` is ambiguous because the root and the display node share that id (the prop already ends in `-display`), scope the assertion to the display node or to `markdown-field-display` inside the resource card. Do not click or press Enter. Do not type. There is no textarea while `editable` is false.
- If a spec **does** type into a markdown textarea that is hidden until edit mode, change it to activate the display first (click or Enter on `${automationId}-display`), then type into `${automationId}-input`. Do not type into the resting view. Planning-time survey found no such spec.
- `journey.cy.ts` completion notes stay on the visible `journey-complete-note` textarea. Do not insert a display-activation step. Do not retarget that dialog at `MarkdownEditor`. Profile `journey-profile-notes-display` stays a read-only `SentenceEditor` assertion.
- `path.cy.ts` module and topic description assertions stay on the plain text nodes. Do not treat path `SentenceEditor` description as markdown.
- `navigation.cy.ts` and `deployment.cy.ts` still pass. Touch them only if a 1.0.6 selector breaks. Keep Token-tab `admin-token-display-name-display` and chrome `nav-profile-name-display` assertions. Keep existing catalog / Settings host / logout coverage.
- `README.md` Testing / Automation Support names spa_utils **1.0.6**. State that resource description resting view is package `MarkdownEditor` (rendered markdown; this host asserts the display text and does not open edit mode because the field is read-only), that profile notes and path description stay `SentenceEditor`, and that the complete-resource note stays a dialog textarea. Do not document a local `data-card-grid` id. Do not claim this SPA depends on `marked` or `dompurify`.
- No list card dashboard. No local `CardGrid`. No pin change. No `/mentee/mentee` in `cy.url()` or `href`.

### Craftsmanship Expectations

- Use spa_utils automation ids. Do not invent a local markdown display or card grid to make a selector easier.
- Assert editor behavior at the layer that owns it. A read-only `MarkdownEditor` has no textarea. A `SentenceEditor` and the complete-dialog `v-textarea` must not be rewritten as click-to-edit markdown.
- The failure mode to avoid is a spec that looks green because it types into a hidden textarea, a resource spec “fixed” by opening edit mode on a read-only field, or a new list card dashboard added so Cypress has something to click.
- Do not retarget detail specs at `/mentee/config`. Do not restore a collection. Do not wrap the journey column in `DataCardGrid` to satisfy a selector.

## Testing Expectations

Run all commands from **this SPA repository root**.

- Confirmation searches:
  - `rg 'CardGrid|data-card-grid' cypress src` — zero, unless F138 migrated a real peer multi-card page (then assert that page’s `data-card-grid` only)
  - `rg 'marked|dompurify' package.json` — zero
  - `rg 'MarkdownEditor|markdown-field-display|resource-view-description-display' cypress src` — resource description display assertion only; no textarea typing
  - `rg 'journey-complete-note' cypress/e2e/journey.cy.ts` — still the dialog textarea `.type` path
- `npm run test`
- `npm run test:coverage` — record pre-existing threshold misses (F128 / F133 / F136 / F137). Do not change `vitest.config.ts`.
- `npm run build` — `vue-tsc` is the type gate (this repo defines no `lint` script; record the missing `npm run lint` from issue acceptance criteria as a follow-up rather than adding tooling)

**Packaging verification** (required — last task of the 1.0.6 set):

- `npm run container` — build the SPA container image
- `npm run service` — run db + API + SPA containers
- `npm run cypress:run` — headless end-to-end tests (long running); **all** specs must pass against `http://localhost:8394/mentee/...`

Do not run `npm run dev` and `npm run service` at the same time — both bind host port **8394**.

Record results in **Execution Notes**. The gate that would look correct while bypassing the intended boundary is: a markdown spec typing into a textarea that was never opened; resource description asserted only as a raw textarea while the resting view is rendered HTML; the complete-dialog note retargeted at a display node `v-textarea` does not render; or a new list card dashboard added so Cypress has something to click.

Env notes from prior waves: `GITHUB_FOREVER_TOKEN` as `GITHUB_TOKEN` if the file token is denied by GHCR; `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` before `mh up` so logout specs do not hang on a Tailscale IdP host.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `README.md` — Testing / Automation Support version **1.0.6**; resource description is read-only package `MarkdownEditor` resting view (assert display text, do not open edit mode); profile notes and path description remain `SentenceEditor`; complete-resource note remains a dialog textarea; no local `data-card-grid`

**Update only if a 1.0.6 selector breaks or a real markdown textarea spec exists:**

- `cypress/e2e/resource.cy.ts` — only if `contain.text` on `resource-view-description-display` fails after rendered HTML. Scope to the display node or `markdown-field-display`. Do not activate edit mode. Do not type.
- `cypress/e2e/journey.cy.ts` — only if a non-markdown selector broke. `journey-complete-note` stays a direct `.type` on the visible textarea. Do not add click-to-edit.
- `cypress/e2e/path.cy.ts`, `cypress/e2e/navigation.cy.ts`, `cypress/e2e/deployment.cy.ts` — only if a 1.0.6 selector breaks
- Any Cypress spec that types into a `MarkdownEditor` textarea without opening edit mode — activate `${automationId}-display`, then type into `${automationId}-input`

Do not change the spa_utils pin. Do not add `marked` or `dompurify`. Do not add a collection route or a `DataCardGrid` page. Do not pass disallowed `PageFrame` props. Do not edit `src/**` unless a spec failure proves a 1.0.6 selector bug that cannot be fixed in the spec — and do not convert `SentenceEditor`, the complete-dialog textarea, or the read-only resource description into an editable markdown field to do it.

## Execution Notes

### Plan
1. Reconfirm Context: pin is exact 1.0.6 (F138); only MarkdownEditor is read-only resource description; no CardGrid/DataCardGrid; journey-complete-note is a visible dialog v-textarea; no Cypress markdown typing.
2. Update `README.md` Testing / Automation Support: spa_utils **1.0.6**; resource description is read-only package `MarkdownEditor` resting view (assert display text, do not open edit mode); profile notes and path description stay `SentenceEditor`; complete-resource note stays dialog textarea; no local `data-card-grid`; no claim of `marked`/`dompurify` deps.
3. Run confirmation `rg` searches; `npm run test`; `npm run test:coverage` (record pre-existing threshold misses; do not edit vitest.config.ts); `npm run build`. No lint script — note as follow-up.
4. Packaging: ensure GHCR token / `IDP_LOGIN_URI` if needed; `npm run container`; `npm run service`; `npm run cypress:run`. Touch Cypress specs only if a 1.0.6 selector breaks (`resource.cy.ts` prefer keep `contain.text`; scope to display/`markdown-field-display` if ambiguous; never activate edit mode).
5. Write results into Execution Notes. Leave Status **Pending**.

### Summary
README Testing / Automation Support now documents spa_utils **1.0.6** editor contracts for this host. No Cypress selector changes were required — `resource.cy.ts` `contain.text` on `resource-view-description-display` still passes against rendered markdown HTML; `journey-complete-note` stays a direct `.type` on the dialog textarea. Pin unchanged. Packaging gate passed (37/37). Status left **Pending**.

### Files changed
- `README.md` — Testing / Automation Support notes for read-only `MarkdownEditor` resource description, `SentenceEditor` profile/path fields, dialog `journey-complete-note`, no local `data-card-grid`
- `tasks/PENDING.F139.spa_utils_1_0_6_cypress_and_packaging.md` — this Execution Notes update

### Intentionally not changed
- `package.json` / lockfile (pin remains exact `1.0.6`)
- All `src/**`
- All `cypress/**` specs (no 1.0.6 selector breakage)
- `vitest.config.ts` (thresholds unchanged)

### Confirmation searches
- `rg 'CardGrid|data-card-grid' cypress src` — **zero**
- `rg 'marked|dompurify' package.json` — **zero**
- `rg 'MarkdownEditor|markdown-field-display|resource-view-description-display' cypress src` — `ResourceViewCard.vue` (import + usage) and `resource.cy.ts` `contain.text` assertion only; no textarea typing
- `rg 'journey-complete-note' cypress/e2e/journey.cy.ts` — still `.type('Finished reading')` on the dialog textarea

### Commands and results
1. `npm run test` — **10 files, 48 tests passed**
2. `npm run test:coverage` — **48 tests passed**; exit 1 from **pre-existing** threshold misses (unchanged; did not edit `vitest.config.ts`):
   - `src/composables/**` functions 88.88% < 90%; branches 54.76% < 60%
   - `src/components/**` lines 0% < 90%; statements 0% < 90%
3. `npm run build` — **passed** (`vue-tsc` clean + Vite production build)
4. `npm run lint` — **not defined** in this repo (follow-up vs issue acceptance criteria; do not add tooling here)
5. `npm run container` — **PASS** (image `ghcr.io/mentor-forge/mentorhub_mentee_spa:latest`)
6. `npm run service` — **PASS** (`GITHUB_TOKEN` from `~/.mentorhub/GITHUB_FOREVER_TOKEN`; `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html`; runtime-config confirmed; `/mentee/` → 200)
7. `npm run cypress:run` — **PASS** 37/37 (0 failing):
   - `deployment.cy.ts` 8/8
   - `journey.cy.ts` 9/9
   - `navigation.cy.ts` 11/11
   - `path.cy.ts` 4/4
   - `resource.cy.ts` 5/5

### Cypress selector changes
None. Resource description `contain.text` on `resource-view-description-display` still passes after 1.0.6 sanitized HTML rendering.

### Env workarounds
- Exported `GITHUB_TOKEN` from `~/.mentorhub/GITHUB_FOREVER_TOKEN` before `mh up` / `npm run service` (GHCR pull auth).
- Exported `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` before `mh up` so logout specs do not hang on a Tailscale IdP host. Confirmed in `/mentee/runtime-config.js`.

### Blocker
None.

### Orchestrator confirmation
Re-checked the README diff (Testing / Automation Support only), pin still exact `1.0.6`, confirmation searches (zero CardGrid / data-card-grid / marked / dompurify; resource description still `contain.text`; `journey-complete-note` still direct `.type`). Cypress result **37/37** matches the prior F137 packaged counts (deployment 8, journey 9, navigation 11, path 4, resource 5). Marked shipped.
