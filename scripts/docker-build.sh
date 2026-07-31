#!/usr/bin/env sh
# Local Docker build with CodeArtifact npm auth (run `mh` first, or set AWS SSO profile).
# Build context is the mentor-forge parent folder so file:../mentorhub_spa_utils resolves in the Dockerfile.
set -e

root=$(cd "$(dirname "$0")/.." && pwd)
parent=$(cd "$root/.." && pwd)
cd "$root"

domain="${CODEARTIFACT_DOMAIN:-mentor-forge}"
owner="${AWS_SHARED_SERVICES_ACCOUNT_ID:-560167829275}"
region="${AWS_REGION:-us-east-1}"

export AWS_PROFILE="${MH_AWS_PROFILE_SHARED:-mentorhub-shared}"

TOKEN=$(aws codeartifact get-authorization-token \
  --domain "${domain}" \
  --domain-owner "${owner}" \
  --region "${region}" \
  --query authorizationToken --output text)

export CODEARTIFACT_TOKEN="${TOKEN}"

echo "Building mentorhub_spa_utils (file: dependency for local container)..."
( cd "$parent/mentorhub_spa_utils" && npm run build )

DOCKER_BUILDKIT=1 docker build \
  --secret id=codeartifact_token,env=CODEARTIFACT_TOKEN \
  -f "$root/Dockerfile" \
  -t ghcr.io/mentor-forge/mentorhub_mentee_spa:latest \
  "$parent"
