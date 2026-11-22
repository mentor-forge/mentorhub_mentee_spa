# Mentee SPA AWS exit audit

Before migration, Mentee SPA pinned SPA Utils 1.0.6 in `package.json` and
`package-lock.json`. The old lock had 414 CodeArtifact tarball URLs, including the
shared package and third-party packages. The old tracked root `.npmrc` routed
the Mentor Forge scope to CodeArtifact. Git ignores local config such as
`scripts/.npmrc` and `.env.local`. The README and task planning guide
previously referenced CodeArtifact authentication for dependency setup.

| Path | Previous dependency | Cutover |
| --- | --- | --- |
| `package.json`, `package-lock.json`, `.npmrc` | CodeArtifact pin, resolved tarballs, and scoped registry | Pin the published SPA Utils 1.0.7 release exactly from GitHub Packages. Resolve third-party packages from public npm and keep the regenerated lockfile. |
| `Dockerfile`, `scripts/docker-build.sh` | The wrapper uses the AWS CLI to obtain a CodeArtifact token and the Dockerfile consumes it through the `codeartifact_token` BuildKit mount | Use a GitHub Packages read token through a scoped BuildKit secret and install from the committed lock. |
| `.github/workflows/docker-push.yml` | AWS OIDC credentials and a CodeArtifact token for the image build | Validate pull requests separately and keep GHCR publishing on main. Give the workflow only the package access it needs. |
| `README.md`, `tasks/_PLANNING.md` | Developer instructions assume CodeArtifact credentials | Document the GitHub Packages token and locked setup. |

## Shared package prerequisite and rollback

[I-US01](https://github.com/mentor-forge/mentorhub_spa_utils/issues/43) specifies
public visibility for SPA Utils on GitHub Packages. Direct tarball access
requires authentication. Verified the published 1.0.7 tarball against the
lockfile SHA-512 and confirmed that an anonymous request returns HTTP 401.
The tracked npm config scopes the `GITHUB_TOKEN` to GitHub Packages. Use a
token with `read:packages` for local installs. The lockfile resolves all
third-party packages from public npm and retains their versions and checksums.

Both a clean `npm install --include=dev` and a fresh-cache `npm ci --include=dev`
passed with AWS configuration absent. All 48 unit tests and the TypeScript
and Vite production build passed. Grant this repository read access under the
shared package’s **Manage Actions access** settings and verify the workflow
token in hosted CI.

For later rollbacks, restore the last verified exact GitHub Packages
version and matching lockfile together. Verify the restored install and rebuild
the image before redeployment. The pre-migration 1.0.6 lock requires legacy
CodeArtifact access and cannot serve as an AWS-free rollback.

## Runtime boundary

`src/initAuth.ts` calls shared `bootstrapAuthFromUrl` and
`syncAuthFromStorage`. `src/composables/useAuth.ts` re-exports the shared
authentication and role helpers. The SPA consumes the package root and its
Cypress auth helpers. Preserve the shared JavaScript, types, styles, and
Cypress exports during cutover. Tracked application sources contain no direct
Cognito, AWS SDK, or AWS endpoint references.

Vite uses `VITE_IDP_LOGIN_URI` and proxies the Mentee API for local
development. The packaged app loads `runtime-config.js` before bootstrapping
and reads its `IDP_LOGIN_URI`. Nginx proxies API requests through
`API_HOST` and `API_PORT`. Preserve the Mentee route prefix, the
shared-origin links, and the existing JWT and role behavior. The migration
requires no Mentee-specific auth adapter, OpenAPI change, or data schema
change. [Mentor Hub coordination](https://github.com/mentor-forge/mentorhub/issues/80)
defers production identity and hosting selection. Local acceptance uses the
existing Developer Edition services.

The runtime image currently uses the floating `nginx:stable-alpine` tag.
The separate Nginx task owns the version pin and dual-architecture validation.
Retain the packaged Cypress deployment checks and assess Vite coverage
separately during acceptance.

## Container build

Set a local GitHub Packages read token in `GITHUB_TOKEN`, then run
`npm run container`. The wrapper passes it to BuildKit as an environment-backed
secret. Only the locked `npm ci` install can access the secret. Its host-scoped
npm config lives in a temporary mount, and the build context excludes npm
config files. The default GHCR image tag is unchanged. Set `MENTEE_SPA_IMAGE`
to build an isolated local tag.

An ARM64 image built with AWS variables unset. Its final history and filesystem
contained no npm credentials or secret config. The complete packaged Cypress
suite passed against an isolated Mentee API and seeded MongoDB.
## GitHub Actions

Pull requests into main first verify that the lock agrees with the manifest
and that tarballs resolve from the expected registries. Fork and Dependabot pull
requests run only this credential-free check. Same-repository pull requests
also use the built-in workflow token with package read access for a locked
install, unit tests, type checking, production build, and an unpublished
container build. In the SPA Utils package settings, grant this repository
Actions read access if the workflow token cannot download the package.

Pushes to main publish the AMD64 and ARM64 image under the existing GHCR tag.
The publishing job reads repository contents and has package write access.
Both container workflows pass package authentication through the BuildKit
secret named `github_npm_token`. Hosted package access is verified on the PR
after the branch is pushed.
