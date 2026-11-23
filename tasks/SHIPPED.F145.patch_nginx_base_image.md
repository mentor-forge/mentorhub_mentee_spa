# F145 — Patch the Nginx base image built by CI

**Status**: Shipped
**Type**: Defect  
**Depends On**: F144  
**Issue**: https://github.com/mentor-forge/mentorhub_mentee_spa/issues/39  
**Description**: Replace the floating Nginx runtime base with the latest patched stable Alpine image, refresh builds, and prove the packaged SPA still meets its deployment contract.

## Context

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub/DeveloperEdition/standards/sre_standards.md`
- `../mentorhub/DeveloperEdition/standards/security_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `../mentorhub/DeveloperEdition/standards/api_standards.md`
- `tasks/_PLANNING.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/PENDING.F144.spa_migration_acceptance.md` (resolve by task ID after lifecycle renaming)
- `Dockerfile`
- `.github/workflows/docker-push.yml`
- `package.json`
- `scripts/docker-build.sh`
- `nginx.conf.template`
- `cypress.config.ts`
- `cypress/e2e/deployment.cy.ts`
- `cypress/e2e/journey.cy.ts`
- `cypress/e2e/navigation.cy.ts`
- `cypress/e2e/path.cy.ts`
- `cypress/e2e/resource.cy.ts`
- [Official Nginx releases](https://nginx.org/en/download.html)
- [Official Nginx security advisories](https://nginx.org/en/security_advisories.html)
- [Official Docker image definitions](https://github.com/nginx/docker-nginx)

Execution follows F144, so its migrated registry/auth configuration is authoritative. Preserve the GitHub-hosted dependency migration and cloud-agnostic local runtime. Do not restore AWS CLI, OIDC, CodeArtifact endpoints, or CodeArtifact secrets. No production provider choice or AWS teardown is required for this security update.

The pre-migration Dockerfile uses `FROM nginx:stable-alpine`. The publishing workflow builds `linux/amd64,linux/arm64` on pushes to `main` and publishes `ghcr.io/mentor-forge/mentorhub_mentee_spa:latest`. A floating tag does not identify the binary in an existing published image.

The planning guide contains inherited API wording and references a nonexistent `tasks/README_API.md`; use this SPA's actual `package.json`, README, and orchestration guide. No API contract or data schema change is needed.

## Goals

- At execution time, select the newest patched **stable** upstream Nginx release with an available official Alpine image supporting both target architectures. Record release/advisory URLs, retrieval date, version, image tag, and multi-platform index digest in Execution Notes. Do not copy an old version number from conversation history or silently switch to mainline.
- Identify applicable Nginx advisories using the actual image version, enabled modules (`nginx -V`), and effective configuration. The reported CVE was not supplied; distinguish confirmed affected findings from configuration-dependent or unrelated findings.
- Pin the Dockerfile runtime base to the verified explicit version tag plus multi-platform index digest, keeping Alpine and existing runtime startup behavior. Use the index digest rather than a single-architecture manifest digest.
- In `.github/workflows/docker-push.yml`, set `pull: true` on the existing build action. Keep publishing restricted to `push` on `main`, both target platforms, current registry tags, cache settings, and the migrated GitHub package authentication.
- Add `--pull` to the existing local scripts/docker-build.sh build command so local packaging follows the refreshed-base policy. Preserve the migrated GitHub npm BuildKit secret and all other build behavior.
- Verify the final application image's actual Nginx binary and configuration, rather than relying on a base tag or a successful Vite build. Record image IDs/digests and scan evidence per architecture.
- Document the chosen Nginx pin and the short verification/update procedure in README without duplicating the digest outside the Dockerfile.
- Preserve immutable promotion: build once and promote the same application digest through test, staging, and production. Post-merge CI must publish a fresh image; record its digest and verify its version before marking the security issue resolved. Do not manually publish or deploy during this task's pre-merge work.

### Craftsmanship Expectations

- Keep changes limited to Nginx base selection and fresh-base build behavior. Reuse the current build paths and existing deployment tests.
- Preserve journey prefixes, API proxy ownership, runtime IdP injection, cache headers, shared spa_utils auth/navigation behavior, and automation IDs.
- Do not change application dependency versions, authentication, API contracts, shared utility repositories, or infrastructure as part of this update.
- If a required patched multi-platform image, registry access, GitHub package credentials, Docker runtime, or backing service is unavailable, record the exact blocker and mark the task Blocked. Do not claim verification or weaken tests to pass.

## Testing Expectations

- Validate the YAML and diff: the base uses the verified pin; CI requests a pull, keeps both architectures, and retains its main-only publishing trigger. Use available existing lint tooling; do not introduce a dependency solely for this check.
- Using the GitHub npm authentication established by the predecessor tasks, with no AWS CLI/credentials prerequisite, run `npm ci --include=dev`, `npm run test`, and `npm run build`. Run the existing lint script only if present in package.json. Do not modify the lockfile for this base-image update.
- **Packaging verification**: run `npm run container`, then `npm run service`, then `npm run cypress:run` against the packaged SPA at `http://localhost:8394/mentee/`. Stop Vite first. Confirm the running container image ID matches the freshly built local application image; a pulled old image is not evidence. Running the API alone does not run the SPA.
- In existing `cypress/e2e/deployment.cy.ts`, verify redirects, HTTP history fallback, fingerprinted asset caching, HTML/runtime-config `no-store`, matching root/prefixed runtime config, API `*.js` precedence, an authenticated least-privileged request, and an unauthenticated API failure. Use the complete existing Cypress suite without adding redundant tests or weakening assertions.
- Validate the generated configuration with `nginx -t -c /tmp/nginx.conf` inside the running SPA container. A bare `nginx -t` against a different config is insufficient.
- Also smoke-test the supported shared-origin `:8080/mentee/` entry and its prefixed API path. Build the final application image for **both** amd64 and arm64 using the existing build/auth conventions (Buildx local exports or separate local platform tags; no registry push). Run `nginx -v` and `nginx -V` against each built image, with explicit platform selection/emulation where needed, and compare with the selected patched version.
- Scan each final application image using an available container scanner with current advisory data. Record scanner/database versions, target image identity, applicable Nginx findings and disposition, and remaining unrelated findings. Scanner unavailability or missing architecture validation is a blocker, not a passing result.
- Record commands, results, image identities, and advisory decisions in Execution Notes. Publishing only occurs after human review and merge under existing CI. Leave a clearly identified post-merge check for the published multi-platform image's digest and binary versions; the issue remains open until that check succeeds.

## Outputs

Implementation may change only:
- `Dockerfile` — explicit patched stable Alpine tag and multi-platform digest.
- `.github/workflows/docker-push.yml` — fresh-base pull setting.
- `scripts/docker-build.sh` — fresh-base local build option.
- `README.md` — short Nginx update/verification procedure.
- `tasks/PENDING.F145.patch_nginx_base_image.md` — execution evidence and lifecycle update; rename to `tasks/SHIPPED.F145.patch_nginx_base_image.md` only after required pre-merge validation and commit, or the corresponding `BLOCKED.` filename if prerequisites fail.

Existing test files to execute unchanged:
- `cypress/e2e/deployment.cy.ts`
- `cypress/e2e/journey.cy.ts`
- `cypress/e2e/navigation.cy.ts`
- `cypress/e2e/path.cy.ts`
- `cypress/e2e/resource.cy.ts`

All other files remain outside this task's output scope. If verification reveals a required config or test correction, record it for replanning rather than silently expanding outputs.

## Execution Notes

### Base image and advisory review

Reviewed on November 21, 2026 (Eastern time). The [official download
page](https://nginx.org/en/download.html) identified 1.30.7 as stable. The
[official image definitions](https://github.com/nginx/docker-nginx) and
`docker buildx imagetools inspect nginx:1.30.7-alpine` confirmed the
`nginx:1.30.7-alpine` official image and its Linux AMD64 and ARM64 manifests.
Pinned OCI index
`sha256:caf4e1e032a20f9c3c5e28fc7f25ffd768ad8677b4975c54193075997b3a97e3`.
The migrated main-only GHCR workflow and local build helper already requested
a refreshed base and kept GitHub Packages authentication scoped to BuildKit.

The [upstream advisories](https://nginx.org/en/security_advisories.html) list
CVE-2026-123634 (resolver) as fixed in stable 1.30.7. The effective SPA
configuration uses Docker DNS via `resolver`, so this update directly matters.
The HTTP/2, HTTP/3, TLS, mail, and stream advisory prerequisites are
configuration-dependent. The binaries include relevant modules, but the
effective SPA configuration uses plain HTTP on port 80 and has no HTTP/2,
QUIC, TLS, mail, or stream listener. It has no `alias` or PROXY protocol
listener either. The cited PROXY protocol issue affects only mainline
1.31.4–1.31.8. The original report did not supply a CVE and the historical
floating tag does not establish the old published binary or its exposure.

### Local acceptance

- Clean `npm ci --include=dev`, `npm run test` (48 tests),
  and `npm run build` passed. The package has no lint script. The dependency
  lock is unchanged.
  Validated the YAML, main-only publishing trigger, target platforms, pull
  flags, and existing scoped BuildKit secret.
- Ran `npm run container` and used isolated equivalents of
  `npm run api` and `npm run service` to avoid `mh down` against the
  running Developer Edition stack. The fresh packaged ARM64 SPA used isolated
  seeded MongoDB and Mentee API. The running container matched the built
  image ID. The full unchanged `npm run cypress:run` at
  `http://localhost:8394/mentee/` passed all 37 checks, including all eight
  deployment checks. The generated configuration passed
  `nginx -t -c /tmp/nginx.conf`.
- The actual Developer Edition gateway configuration served the shared-origin
  Mentee page and runtime configuration on isolated port 8080. The
  prefixed API returned HTTP 200 with a valid local token and 401 without it.

### Image and scan evidence

Built ARM64 with `npm run container` and AMD64 with disposable Buildx
(`--pull --platform linux/amd64 --load` and the scoped BuildKit npm secret).
Verified both final binaries with `nginx -v` and `nginx -V`, running the AMD64
binary under QEMU. Both report Nginx 1.30.7 with HTTP SSL, HTTP/2, HTTP/3,
mail, stream, and stream SSL preread support.

| Platform | Final local application image ID |
| --- | --- |
| ARM64 | `sha256:868baea57282fe0fd9b2f9fa676f2eaa18ad57ff6d33602561956b8e8c5705a0` |
| AMD64 | `sha256:ca71d0d5761994e20d36c22ce9fc2b73565832b25bb4b5f12aca7a91f5cdb938` |

Trivy 0.76.2 scanned the saved application images against vulnerability
database schema 2, updated November 21 at 18:38 UTC and fetched November 22 at
00:40 UTC. Both Alpine 3.24.4 images had zero Nginx package findings and 12
Alpine dependency findings. Five each affect libcrypto3 and libssl3, one medium
affects zlib, and one high affects libxml2. The unchanged npm dependency tree
has 22 existing audit findings.

### Post-merge publication

After CI publishes from main, record the GHCR index and both platform manifest
digests. Pull each by its immutable application digest and confirm the Nginx
binary version, build options, and scan results before closing issue 39. Promote
the verified immutable application image between environments.
