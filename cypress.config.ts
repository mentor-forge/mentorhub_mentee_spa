import createBundler from '@bahmutov/cypress-esbuild-preprocessor'
import { defineConfig } from 'cypress'
import jwt from 'jsonwebtoken'
import { e2eDefaultJwtSecret } from '@mentor-forge/mentorhub_spa_utils/cypress/jwtDefaults'

const E2E_PROFILE_ID = 'A00000000000000000000001'
const E2E_CUSTOMER_ID = 'D00000000000000000000006'
const E2E_SUBJECT = 'cypress-user'
const E2E_NAME = 'Cypress User'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8394',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    screenshotOnRunFailure: true,
    env: {
      JWT_SECRET: e2eDefaultJwtSecret(),
    },
    setupNodeEvents(on) {
      on('task', {
        signCypressJwt(opts: { roles: string[]; secret: string }) {
          const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365
          const token = jwt.sign(
            {
              sub: E2E_SUBJECT,
              name: E2E_NAME,
              iss: 'dev-idp',
              aud: 'dev-api',
              roles: opts.roles,
              profile_id: E2E_PROFILE_ID,
              customer_id: E2E_CUSTOMER_ID,
              mentor_id: '',
              exp,
            },
            opts.secret,
            { algorithm: 'HS256' }
          )
          return { token, expiresAt: new Date(exp * 1000).toISOString() }
        },
      })
      // Webpack cannot parse TS from spa_utils in node_modules; esbuild bundles it.
      on('file:preprocessor', createBundler())
    },
  },
})