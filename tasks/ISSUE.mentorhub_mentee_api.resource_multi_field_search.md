# Resource list multi-field search filters

## Summary

Extend `GET /api/resource` so mentees can filter the resource list by text in fields beyond `name`. The mentee SPA will search by **name**, **description**, **url**, **interests**, **technologies**, and **skill_level**. Today the list endpoint only documents query filters for `name`, `description`, and `status`.

Copy this handoff into the `mentorhub_mentee_api` `_PLANNING` / issue workflow. Do not implement the API from the mentee SPA orchestration.

## Current API (confirmed from running OpenAPI)

`GET /api/resource` already supports:

| Query param | Behavior |
|-------------|----------|
| `name` | Case-insensitive substring match on `name` |
| `description` | Case-insensitive substring match on `description` |
| `status` | Comma-separated `$in` match |

The **Resource** schema already includes (among others):

- `url` (string, URI)
- `interests` (array of enum strings)
- `technologies` (array of enum strings)
- `skill_level` (enum string)

Those fields are returned on resource documents but are **not** list query parameters.

## Requested API changes

Add optional query filters on `GET /api/resource` consistent with existing substring / multi-value patterns:

| Query param | Suggested match behavior |
|-------------|--------------------------|
| `url` | Case-insensitive substring match on `url` |
| `interests` | Match resources whose `interests` array contains any of the comma-separated values (same style as `status`) |
| `technologies` | Match resources whose `technologies` array contains any of the comma-separated values |
| `skill_level` | Match resources whose `skill_level` equals any of the comma-separated values (or a documented substring/enum match) |

Also:

1. Document each new parameter in the served OpenAPI (`/docs/openapi.yaml`) with examples.
2. Keep existing `name` / `description` / `status` / sort / offset-size header pagination behavior unchanged.
3. Clarify whether multiple filters are **AND**ed (preferred, matches today’s `name` + `description` + `status` composition).
4. Add API tests covering each new filter (empty, match, no-match, combined with pagination).

## Out of scope for this handoff

- SPA UI wiring (owned by `mentorhub_mentee_spa` L111).
- Changing Resource document shape or enumerator values.
- A single free-text `q` / full-text OR-across-all-fields parameter — not required if discrete filters above are provided; the SPA can target one field (or AND multiple) per request.

## Downstream SPA expectations (after API ships)

- Confirm new params via `curl http://localhost:8393/docs/openapi.yaml`.
- Extend `ListParams` / `api.getResources` and Resources list search UI to send `url`, `interests`, `technologies`, and `skill_level` in addition to existing `name` / `description`.
- Keep Cypress resource search coverage aligned with the new query contract.

## Notes

- Field name in OpenAPI is **`technologies`** (plural), not `technology`.
- Field name in OpenAPI is **`skill_level`**.
- `description` filtering already exists; SPA work can adopt it immediately without waiting on this issue.
