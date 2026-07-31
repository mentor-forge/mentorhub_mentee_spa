# Build stage (Node 24+; aligns with package.json engines)
# Build context: mentor-forge parent dir (see scripts/docker-build.sh) so file:../mentorhub_spa_utils resolves.
FROM node:24-alpine AS build

ENV NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /app

COPY mentorhub_mentee_spa/package*.json mentorhub_mentee_spa/.npmrc ./
COPY mentorhub_spa_utils/package.json ./mentorhub_spa_utils/package.json
COPY mentorhub_spa_utils/dist ./mentorhub_spa_utils/dist
RUN sed -i 's|file:../mentorhub_spa_utils|file:./mentorhub_spa_utils|' package.json

ARG VITE_IDP_LOGIN_URI=http://127.0.0.1:8080/login.html
ENV VITE_IDP_LOGIN_URI=$VITE_IDP_LOGIN_URI

# Pre-built ./mentorhub_spa_utils (see scripts/docker-build.sh). --ignore-scripts skips spa_utils prepare.
# Omit devDependencies (Cypress/Vitest/etc.) so multi-arch CI does not run Cypress under QEMU.
RUN --mount=type=secret,id=codeartifact_token \
    --mount=type=cache,target=/root/.npm \
    sh -c 'echo "//mentor-forge-560167829275.d.codeartifact.us-east-1.amazonaws.com/npm/mentorhub-npm/:_authToken=$(cat /run/secrets/codeartifact_token)" >> .npmrc && \
    npm install --omit=dev --ignore-scripts'

COPY mentorhub_mentee_spa/src ./src
COPY mentorhub_mentee_spa/public ./public
COPY mentorhub_mentee_spa/index.html mentorhub_mentee_spa/vite.config.ts mentorhub_mentee_spa/tsconfig.json mentorhub_mentee_spa/tsconfig.node.json ./
RUN --mount=type=cache,target=/app/node_modules/.vite \
    npm run build

RUN DATE=$(date "+%Y-%m-%d:%H:%M:%S") && echo "$DATE" > ./dist/patch.txt

# Deploy stage
FROM nginx:stable-alpine

LABEL org.opencontainers.image.source="https://github.com/mentor-forge/mentorhub_mentee_spa"

ENV API_HOST=mentorhub_mentee_api
ENV API_PORT=8393
ENV IDP_LOGIN_URI=http://127.0.0.1:8080/login.html

COPY --from=build /app/dist /usr/share/nginx/html
COPY mentorhub_mentee_spa/nginx.conf.template /etc/nginx/nginx.conf.template

# envsubst for runtime nginx config (API_HOST/API_PORT in proxy_pass) and runtime-config.js (IDP_LOGIN_URI)
RUN apk add --no-cache gettext

EXPOSE 80

# Note: \${API_HOST} \${API_PORT} \${IDP_LOGIN_URI} must be escaped so the shell passes them literally to envsubst
CMD sh -c "envsubst '\${API_HOST} \${API_PORT}' < /etc/nginx/nginx.conf.template > /tmp/nginx.conf && \
  envsubst '\${IDP_LOGIN_URI}' < /usr/share/nginx/html/runtime-config.js.template > /usr/share/nginx/html/runtime-config.js && \
  exec nginx -g 'daemon off;' -c /tmp/nginx.conf"
