# F137 – 1.0.3 `display_name` Cypress and packaging

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F136_pin_spa_utils_1_0_3`  
**Description**: Point Cypress at spa_utils **1.0.3** Token-tab and PageFrame `display_name` behavior, keep existing 1.0.1 catalog / `/mentee/config` host coverage, and run the packaged SPA as the acceptance gate for [F-ES15 / GitHub #35](https://github.com/mentor-forge/mentorhub_mentee_spa/issues/35).

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — E2E covers pages; automation ids are a stable UI API
- `../mentorhub_spa_utils/README.md` — Token tab `display_name` → `admin-token-display-name-display`; PageFrame chrome `nav-profile-name-display` inside `nav-profile-link` when JWT `display_name` is present and non-blank; **no** fallback to `name` / `given_name` / `email` / `user_id` / `sub`; missing Token-tab strings render `N/A`. Live Developer Edition / `signCypressJwt` tokens may still omit `display_name` — stub intercepts / JWT payload in Cypress rather than synthesizing claims in app code
- `README.md` — after F136 should name spa_utils **1.0.3**; Automation Support may still omit Token `display_name` ids
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `tasks/PENDING.F136.pin_spa_utils_1_0_3.md` (or shipped successor) — pin and local token-claim alignment already done; use Execution Notes if types/fixtures changed
- `cypress.config.ts` — `baseUrl` stays `http://localhost:8394`
- `cypress/support/e2e.ts` — `registerAuthCommands({ visitPath: '/mentee/' })`
- `cypress/support/commands.ts` — `visitPrefixed` only; spa_utils demo `stubJwtDisplayName` is **not** a packaged export — do not copy the demo helper into this repo unless a tiny inline JWT patch in a spec is required
- `cypress/e2e/navigation.cy.ts` — `adminConfigBody.token` currently has `profile_id` / `customer_id` / `mentor_id` only; Token tab asserts those three ids; chrome asserts `nav-profile-link` but not `nav-profile-name-display`
- `cypress/e2e/journey.cy.ts`, `cypress/e2e/path.cy.ts`, `cypress/e2e/resource.cy.ts` — prefixed detail coverage; keep. Journey profile `full_name` and path/resource `name` are **not** token `display_name`.
- `cypress/e2e/deployment.cy.ts` — nginx prefix / API proxy; keep unless a selector breaks
- `src/pages/AdminPage.vue` — packaged `AdminPage` pass-through of `config.token`

Cypress runs against **8394**. Collection hamburger `href`s from `buildJourneyUrl` still include **`:8080`**. **Settings is the exception:** `hostingConfigHref()` stays on the current origin (`http://localhost:8394/mentee/config`).

`npm run dev` and `npm run service` both bind host port **8394**. Cypress runs against `npm run service`.

`cy.login()` with no argument seeds an **admin** token. Use `cy.login(['mentee'])` for mentee pages and `cy.login(['admin'])` for Settings. Do **not** change the spa_utils pin in this task.

## Goals

- **Token tab (present):** after admin Settings navigation, stub `GET **/mentee/api/config` with a `token` object that includes `display_name` plus the existing `profile_id`, `customer_id`, and `mentor_id`. Open `admin-tab-token` and assert `admin-token-display-name-display` (read-only input value) **and** the three existing id displays. Do not assert a token `name` field.
- **Token tab (missing):** a second intercept whose token omits `display_name` (and does not supply `name` / `given_name` / `email` as a substitute) must show `N/A` on `admin-token-display-name-display`. This is the failure mode that would look correct if spa_utils still mapped `name` → display.
- **PageFrame chrome:** default `cy.login(['admin'])` / `cy.login(['mentee'])` may remain compact (no `nav-profile-name-display`) because `signCypressJwt` omits the claim. If this SPA asserts chrome `display_name`, patch the stored JWT payload in the spec (or a one-off command) and reload — do not add app-code fallbacks and do not vendor spa_utils demo `commands.ts`. When the claim is stubbed, `nav-profile-name-display` inside `nav-profile-link` shows the stubbed name. When it is absent, that node is omitted.
- Existing F135 coverage still passes: 1.0.1 catalog (mentee vs admin vs least-privileged), Settings `href` on hosting `/mentee/config`, Events/Home/Notifications on welcome `:8080`, removed Products/Customer/Members ids, non-admin `/mentee/config` gate, logout `return_to=http://localhost:8080/discovery/`.
- Detail specs (`journey`, `path`, `resource`) and `deployment.cy.ts` still pass; touch them only if a 1.0.3 selector breaks. Do not retarget journey profile `full_name` or path/resource `name` assertions at token `display_name`.
- `README.md` Testing / Automation Support lists Token-tab `admin-token-display-name-display` and chrome `nav-profile-name-display` as spa_utils 1.0.3 ids this host asserts (not local `nav-*` ids).
- No local Token UI. No `/mentee/mentee` in `cy.url()` or `href`.

### Craftsmanship Expectations

- Use spa_utils PageFrame / TokenClaimsCard automation ids; do not invent a local Token card.
- Assert `display_name` at the layer that owns it: config intercept → Token tab; JWT localStorage → chrome. A test that only checks final text without the stubbed source would miss a leftover `token.name` mapping.
- Do not restore a local drawer. Do not add an Events route. Do not pass disallowed `PageFrame` props.
- Prefer extending `navigation.cy.ts` over adding a new spec file unless the file becomes unreadable.

## Testing Expectations

Run all commands from **this SPA repository root**.

- Confirmation searches:
  - `rg 'token\.name|token\[.name.\]|token\.get\(.name.\)' src cypress README.md`
  - `rg 'display_name|admin-token-display-name-display|nav-profile-name-display' cypress README.md`
- `npm run test`
- `npm run test:coverage`
- `npm run build` — `vue-tsc` is the type gate (this repo defines no `lint` script; record the missing `npm run lint` from issue acceptance criteria as a follow-up rather than adding tooling)

**Packaging verification** (required — last task of the F-ES15 / 1.0.3 set):

- `npm run container` — build the SPA container image
- `npm run service` — run db + API + SPA containers
- `npm run cypress:run` — headless end-to-end tests (long running); **all** specs must pass against `http://localhost:8394/mentee/...`

Do not run `npm run dev` and `npm run service` at the same time — both bind host port **8394**.

Record results in **Execution Notes**. The gate that would look correct while bypassing the intended boundary is: Token tab populated from `name` / `given_name` / `email` while `display_name` is absent; chrome showing a fabricated name when the JWT claim is missing; or Token tab still omitting `admin-token-display-name-display` after the 1.0.3 pin.

Env notes from prior waves: `GITHUB_FOREVER_TOKEN` as `GITHUB_TOKEN` if the file token is denied by GHCR; `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` before `mh up` so logout specs do not hang on a Tailscale IdP host.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `cypress/e2e/navigation.cy.ts` — config token stub includes `display_name`; Token tab present + missing (`N/A`) assertions; optional JWT chrome stub for `nav-profile-name-display`; keep existing catalog / Settings host / logout coverage
- `cypress/e2e/deployment.cy.ts` — only if a prefix assertion must mention Token ids
- `cypress/e2e/journey.cy.ts`, `cypress/e2e/path.cy.ts`, `cypress/e2e/resource.cy.ts` — only if a 1.0.3 selector breaks
- `cypress/support/commands.ts` / `cypress/support/e2e.ts` — only if a minimal JWT `display_name` stub is required and cannot live inline in the spec
- `cypress/fixtures/**` — only if Token/config intercepts need a fixture
- `README.md` — Testing / Automation Support 1.0.3 Token `display_name` and chrome ids

Do not restore a local drawer. Do not change the spa_utils pin. Do not add an Events route or list dashboards. Do not pass disallowed `PageFrame` props. Do not implement `display_name` fallbacks in `src/**`. Do not rename Profile / Path / Resource document `name` fields.

## Execution Notes

**Plan**

1. Keep spa_utils pin at exact **1.0.3**. Do not touch `src/**` or add `display_name` fallbacks.
2. Extend `cypress/e2e/navigation.cy.ts` (prefer over a new spec):
   - Add `display_name` to the default `GET **/mentee/api/config` token stub alongside existing `profile_id` / `customer_id` / `mentor_id`.
   - After Settings navigation (`nav-settings-link` → `/mentee/config`), assert Token-tab `admin-token-display-name-display` input value **and** the three id displays. Do not assert a token `name` field.
   - Second intercept: omit `display_name`; include decoy `name` / `given_name` / `email` (the leftover-mapping failure mode) and assert `N/A` on `admin-token-display-name-display`.
   - Default `cy.login(['mentee'])` / `cy.login(['admin'])` chrome stays compact: `nav-profile-name-display` must not exist (`signCypressJwt` omits the claim).
   - Optional chrome present case: inline JWT payload patch + reload (do **not** vendor spa_utils demo `stubJwtDisplayName`). Intercept config so the unsigned patched JWT cannot 401 `loadConfig`. Assert `nav-profile-name-display` inside `nav-profile-link`.
3. Keep existing F135 catalog / Settings host / logout / non-admin gate coverage. Do not retarget journey `full_name` or path/resource `name`. Touch detail / deployment specs only if a 1.0.3 selector breaks.
4. README Testing / Automation Support: list Token-tab `admin-token-display-name-display` and chrome `nav-profile-name-display` as spa_utils **1.0.3** ids this host asserts.
5. Confirmation searches, unit tests, coverage (record pre-existing threshold misses), build (`vue-tsc`; no `lint` script), then packaging (`container` / `service` / `cypress:run`). Env: `GITHUB_FOREVER_TOKEN` as `GITHUB_TOKEN` if GHCR denies; `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` before `mh up` so logout specs do not hang.

### Summary (2026-09-03)

Extended Cypress against spa_utils **1.0.3** Token-tab and PageFrame `display_name` without changing the pin or adding local fallbacks. `GET **/mentee/api/config` token stub now includes `display_name`; Token tab asserts `admin-token-display-name-display` plus the three ids. A second intercept omits `display_name` and supplies decoy `name` / `given_name` / `email` so leftover mapping would fail — UI shows `N/A`. Default login chrome stays compact; an inline JWT payload patch + reload asserts `nav-profile-name-display` inside `nav-profile-link`. README Testing / Automation Support lists those 1.0.3 ids as host-asserted. Packaging gate passed against `http://localhost:8394/mentee/...`.

**Files changed**
- `cypress/e2e/navigation.cy.ts` — Token present + missing (`N/A` / decoys), compact chrome, stubbed JWT chrome
- `README.md` — Testing / Automation Support 1.0.3 Token and chrome ids
- this task file (plan, results, status)

**Unchanged**
- spa_utils pin remains exact `1.0.3`
- `deployment.cy.ts`, `journey.cy.ts`, `path.cy.ts`, `resource.cy.ts`, `commands.ts`, `e2e.ts`, fixtures, `src/**`

**Confirmation searches**
- `rg 'token\.name|token\[.name.\]|token\.get\(.name.\)' src cypress README.md` — zero hits
- `rg 'display_name|admin-token-display-name-display|nav-profile-name-display' cypress README.md` — `navigation.cy.ts` (stubs + assertions) and README docs only

**Test results**
- `npm run lint` — **no `lint` script** (follow-up per issue acceptance criteria; `vue-tsc` is the type gate)
- `npm run test` — 10 files / 48 tests passed
- `npm run test:coverage` — tests 48/48 pass; threshold **exit 1** is pre-existing (F128 / F133 / F136). `src/api/**` still above (97% lines / 82.6% branches / 100% funcs). `src/composables/**` functions **88.88% / 90%**, branches **54.76% / 60%**. `src/components/**` lines/statements **0% / 90%**. `vitest.config.ts` not changed.
- `npm run build` — **vue-tsc clean**; Vite production build succeeded (existing chunk-size warning only)
- `npm run container` — pass; image `ghcr.io/mentor-forge/mentorhub_mentee_spa:latest` (`sha256:05828c18d70891849ea19961f33d92a0d3aa0d961f89adb823754f3b55eff98b`); Docker `JSONArgsRecommended` warning; npm install reported 2 audit vulnerabilities and install-script warnings during image build
- `npm run service` — pass; `mh down && mh up mentee && npm run open` with `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` and `GITHUB_TOKEN` from `GITHUB_FOREVER_TOKEN`
- `npm run cypress:run` — pass against `http://localhost:8394`: `deployment.cy.ts` 8/8, `journey.cy.ts` 9/9, `navigation.cy.ts` 11/11, `path.cy.ts` 4/4, `resource.cy.ts` 5/5; **37/37 passing**, 0 failing

**Env workarounds**
- Exported `GITHUB_TOKEN` from `~/.mentorhub/GITHUB_FOREVER_TOKEN` before `npm run service`
- Set `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` before `mh up` so logout/IdP specs stay on the local Developer Edition IdP (runtime-config confirmed)

**Blockers**: none
