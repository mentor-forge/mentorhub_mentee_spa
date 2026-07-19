# L101 – Provide runtime editor config at startup

**Status**: Pending  
**Type**: Feature  
**Depends On**: L100_bump_spa_utils_0_5_2  
**Description**: Load `/api/config` once at authenticated application startup and `provideEditorConfig` so typed enum editors resolve options from reactive runtime config — never from per-field fetches, hard-coded lists, or OpenAPI.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — Runtime enumerators / `provideEditorConfig`
- `../mentorhub_spa_utils/src/composables/useEditorConfig.ts` — provide/inject contract
- `README.md`
- `src/App.vue` — already calls `useConfig().loadConfig()` on mount when authenticated
- `src/composables/useConfig.ts` — module-scoped config ref + `loadConfig`
- `src/composables/useConfig.test.ts`
- `src/api/types.ts` — `ConfigResponse`
- `src/pages/AdminPage.vue` — separate admin config display (do not conflate with editor provide)
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`

## Goals

- After authenticated startup, the app continues to call `loadConfig()` **once** (existing `App.vue` `onMounted` path is fine; do not add per-field or per-page config fetches for editors).
- `provideEditorConfig` from `@mentor-forge/mentorhub_spa_utils` is called near the app root (e.g. `App.vue`) with the **reactive** config from `useConfig()` so editors update when load completes.
- Typed editors must not invent enumerator values: missing config, loading state, or unknown enumerator names yield empty option lists (spa_utils behavior); the SPA must not hard-code fallback option arrays.
- Do **not** derive enumerator options from OpenAPI.
- Existing `useConfig` helpers (`getEnumeratorValues`, `getDropdownItems`) may remain for non-editor callers during migration; new editor UI must rely on `provideEditorConfig` + editor `enums` props instead of local hard-coded `items`.
- `AdminPage.vue` may keep its own `useQuery(['config'])` for the admin viewer unless a trivial shared-cache improvement is already in Outputs — do not expand scope to refactor admin beyond editor provide.

## Testing Expectations

Run all commands from **this SPA repository root**.

- **Install**
  - `mh` then `npm ci` if dependencies changed (should be unchanged from L100)

- **Unit tests**
  - `npm run test`
  - Update `src/composables/useConfig.test.ts` only if provide wiring or config shape helpers change
  - Add or extend a focused unit test if `App.vue` / bootstrap provide needs coverage (list any new test file under Outputs)

- **Build**
  - `npm run build`

- **Packaging verification**
  - `npm run container`

Manual smoke (optional): with `npm run api` + `npm run dev`, confirm authenticated mount still loads config without console errors from provide wiring.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/App.vue` — `provideEditorConfig(config)` (or equivalent reactive binding) alongside existing `loadConfig` startup
- `src/composables/useConfig.ts` — only if a small export/shape tweak is required for provide compatibility
- `src/composables/useConfig.test.ts` — only if useConfig behavior changes

**Create (only if needed for App provide coverage):**

- A Vitest file covering editor-config provide bootstrap (path chosen by agent; record in Execution Notes)

The agent must not migrate pages or replace `AutoSaveSelect` in this task.

## Execution Notes

(Reserved for the execution agent.)
