/**
 * Host routing and PageFrame wiring for Mentee.
 * Hamburger catalog role gates and collection hrefs are covered in spa_utils.
 */
describe('Navigation (spa_utils PageFrame)', () => {
  const APP_ORIGIN = Cypress.config('baseUrl') as string
  const JOURNEY_PATHNAME = '/mentee/journey'
  const CONFIG_PATHNAME = '/mentee/config'
  const IDP_STUB_PATHNAME = '/login.html'
  const SETTINGS_HREF = `${APP_ORIGIN}${CONFIG_PATHNAME}`
  const STUB_DISPLAY_NAME = 'Ada Lovelace'

  const journeyBody = {
    _id: '507f1f77bcf86cd799439011',
    profile_id: '507f1f77bcf86cd799439011',
    profile: {
      _id: '507f1f77bcf86cd799439011',
      display_name: 'Jane Mentee',
      email: 'jane@example.com',
      goals: ['Learn Python'],
      interests: ['api'],
      description: 'Working toward first internship.',
      status: 'active',
    },
    status: 'active',
    later: [],
    next: [],
    now: [],
    library: [],
  }

  const adminConfigBody = {
    config_items: [],
    versions: [],
    enumerators: [],
    token: {
      display_name: STUB_DISPLAY_NAME,
      profile_id: 'profile-e2e',
      customer_id: 'customer-e2e',
      mentor_id: 'mentor-e2e',
    },
  }

  /** Point the container's IdP at a same-origin stub: the real value is a cross-origin
   *  Tailscale MagicDNS host, and `runtime-config.js` is the highest-priority source. */
  function stubIdpLoginUri() {
    cy.intercept('GET', '**/mentee/runtime-config.js', {
      statusCode: 200,
      headers: { 'content-type': 'application/javascript', 'cache-control': 'no-store' },
      body: `window.__MENTORHUB_RUNTIME__ = Object.assign(window.__MENTORHUB_RUNTIME__ || {}, { IDP_LOGIN_URI: '${APP_ORIGIN}${IDP_STUB_PATHNAME}' });`,
    }).as('getRuntimeConfig')

    cy.intercept('GET', `**${IDP_STUB_PATHNAME}*`, {
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      body: '<html><head><title>Stub IdP</title></head><body>stub idp login</body></html>',
    }).as('getIdpLogin')
  }

  function stubJourney() {
    cy.intercept('GET', '**/mentee/api/journey', journeyBody).as('getJourney')
  }

  function stubAdminConfig() {
    cy.intercept('GET', '**/mentee/api/config', adminConfigBody).as('getAdminConfig')
  }

  /**
   * Patch the stored Cypress JWT with `display_name` and reload so packaged
   * PageFrame `readDisplayName()` sees the claim. `signCypressJwt` omits it;
   * do not vendor spa_utils demo `stubJwtDisplayName`.
   */
  function stubStoredJwtDisplayName(displayName = STUB_DISPLAY_NAME) {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('access_token')
      if (!token) {
        throw new Error('stubStoredJwtDisplayName requires an access_token in localStorage')
      }
      const parts = token.split('.')
      if (parts.length < 2 || !parts[1]) {
        throw new Error('stubStoredJwtDisplayName: access_token is not a JWT')
      }
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
      const payload = JSON.parse(atob(padded)) as Record<string, unknown>
      payload.display_name = displayName
      const encoded = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      win.localStorage.setItem('access_token', `${parts[0]}.${encoded}.${parts[2] ?? ''}`)
    })
    cy.reload()
  }

  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('should serve the app shell and its assets under the /mentee/ prefix', () => {
    stubJourney()
    cy.login(['mentee'])

    cy.location('pathname').should('eq', JOURNEY_PATHNAME)
    cy.document().then((doc) => {
      const sources = [...doc.querySelectorAll('script[src]')].map((tag) => tag.getAttribute('src'))
      expect(sources, 'runtime config is fetched under the prefix').to.include(
        '/mentee/runtime-config.js'
      )
      expect(
        sources.some((src) => src?.startsWith('/mentee/assets/')),
        'app bundle is fetched under the prefix'
      ).to.equal(true)
    })
  })

  it('should send API requests to the prefixed /mentee/api base', () => {
    cy.intercept('GET', '**/api/journey', journeyBody).as('anyJourneyRequest')
    cy.login(['mentee'])

    cy.wait('@anyJourneyRequest').then((interception) => {
      expect(new URL(interception.request.url).pathname).to.equal('/mentee/api/journey')
    })
  })

  it('shows Mentee PageFrame chrome', () => {
    stubJourney()
    cy.login(['mentee'])

    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible')
    cy.get('[data-automation-id="nav-profile-link"]').should('be.visible')
    // signCypressJwt omits display_name — compact avatar-only chrome.
    cy.get('[data-automation-id="nav-profile-name-display"]').should('not.exist')
    cy.get('[data-automation-id="page-frame-title"]')
      .invoke('text')
      .invoke('trim')
      .should('equal', 'Mentee')
  })

  it('hosts Settings at /mentee/config for admin with token claims', () => {
    stubJourney()
    stubAdminConfig()
    cy.login(['admin'])
    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible').click({ force: true })

    cy.get('[data-automation-id="nav-settings-link"]')
      .should('have.attr', 'href', SETTINGS_HREF)
      .click()
    cy.wait('@getAdminConfig')
    cy.location('origin').should('eq', APP_ORIGIN)
    cy.location('pathname').should('eq', CONFIG_PATHNAME)
    cy.url().should('not.include', '/mentee/mentee')

    cy.get('[data-automation-id="admin-tab-token"]').click()
    cy.get('[data-automation-id="admin-token-display-name-display"]')
      .find('input')
      .should('have.value', STUB_DISPLAY_NAME)
    cy.get('[data-automation-id="admin-token-profile-id-display"]')
      .find('input')
      .should('have.value', 'profile-e2e')
    cy.get('[data-automation-id="admin-token-customer-id-display"]')
      .find('input')
      .should('have.value', 'customer-e2e')
    cy.get('[data-automation-id="admin-token-mentor-id-display"]')
      .find('input')
      .should('have.value', 'mentor-e2e')
  })

  it('shows N/A on Token tab when config token omits display_name', () => {
    const { display_name: _omitted, ...idsOnly } = adminConfigBody.token
    cy.intercept('GET', '**/mentee/api/config', {
      ...adminConfigBody,
      token: {
        ...idsOnly,
        name: 'Should Not Appear',
        given_name: 'Also Hidden',
        email: 'hidden@example.com',
      },
    }).as('getAdminConfigMissingDisplayName')

    stubJourney()
    cy.login(['admin'])
    cy.visitPrefixed(CONFIG_PATHNAME)
    cy.wait('@getAdminConfigMissingDisplayName')
    cy.url().should('not.include', '/mentee/mentee')

    cy.get('[data-automation-id="admin-tab-token"]').click()
    cy.get('[data-automation-id="admin-token-display-name-display"]')
      .find('input')
      .should('have.value', 'N/A')
      .and('not.have.value', 'Should Not Appear')
    cy.get('[data-automation-id="admin-token-profile-id-display"]')
      .find('input')
      .should('have.value', 'profile-e2e')
    cy.get('[data-automation-id="admin-token-customer-id-display"]')
      .find('input')
      .should('have.value', 'customer-e2e')
    cy.get('[data-automation-id="admin-token-mentor-id-display"]')
      .find('input')
      .should('have.value', 'mentor-e2e')
  })

  it('shows JWT display_name in PageFrame chrome when the claim is stubbed', () => {
    stubJourney()
    stubAdminConfig()
    cy.login(['admin'])
    cy.visitPrefixed(CONFIG_PATHNAME)
    cy.wait('@getAdminConfig')
    stubStoredJwtDisplayName(STUB_DISPLAY_NAME)

    cy.get('[data-automation-id="nav-profile-link"]')
      .should('be.visible')
      .find('[data-automation-id="nav-profile-name-display"]')
      .should('be.visible')
      .and('contain', STUB_DISPLAY_NAME)
  })

  it('should keep an admin on /mentee/config', () => {
    stubJourney()
    stubAdminConfig()
    cy.login(['admin'])
    cy.visitPrefixed(CONFIG_PATHNAME)

    cy.location('origin').should('eq', APP_ORIGIN)
    cy.location('pathname').should('eq', CONFIG_PATHNAME)
    cy.url().should('not.include', '/mentee/mentee')
    cy.get('[data-automation-id="admin-tab-token"]').should('be.visible')
  })

  it('should not keep a non-admin on /mentee/config showing AdminPage', () => {
    stubJourney()
    cy.login(['mentee'])
    cy.visit(CONFIG_PATHNAME)

    cy.origin('http://localhost:8080', () => {
      cy.location('href', { timeout: 10000 }).should('include', '/discovery/')
      cy.location('pathname').should('not.eq', '/mentee/config')
      cy.get('[data-automation-id="admin-tab-token"]').should('not.exist')
      cy.get('[data-automation-id="admin-tab-config"]').should('not.exist')
    })
  })

  it('should clear auth and leave for the IdP login URL on logout', () => {
    stubJourney()
    stubIdpLoginUri()
    cy.login(['mentee'])

    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible').click({ force: true })
    cy.get('[data-automation-id="nav-logout-link"]').should('be.visible').click()

    cy.location('pathname', { timeout: 10000 }).should('eq', IDP_STUB_PATHNAME)
    cy.location('search').then((search) => {
      const returnTo = new URLSearchParams(search).get('return_to')
      expect(returnTo, 'logout return_to').not.to.equal(null)
      const returnUrl = new URL(returnTo!)
      expect(returnUrl.href).to.equal('http://localhost:8080/discovery/')
      expect(returnUrl.hostname).to.equal('localhost')
      expect(returnUrl.port).to.equal('8080')
      expect(returnUrl.pathname).to.equal('/discovery/')
      expect(returnUrl.href).not.to.include('127.0.0.1')
      expect(returnUrl.pathname).not.to.equal('/')
      expect(returnUrl.pathname).not.to.equal('/mentee/')
      expect(returnUrl.href).not.to.include('/mentee/')
    })
    cy.window().then((win) => {
      expect(win.localStorage.getItem('access_token')).to.equal(null)
      expect(win.localStorage.getItem('user_roles')).to.equal(null)
    })
  })

  it('should return an unauthenticated deep link to its prefixed URL after login', () => {
    stubIdpLoginUri()
    cy.visit('/mentee/path/path-1')

    cy.location('pathname', { timeout: 10000 }).should('eq', IDP_STUB_PATHNAME)
    cy.location('search').then((search) => {
      const returnTo = new URLSearchParams(search).get('return_to') ?? ''
      expect(new URL(returnTo).pathname).to.equal('/mentee/path/path-1')
    })
  })

  it('should serve the real container IdP config from the prefixed runtime-config.js', () => {
    cy.request('/mentee/runtime-config.js').then((response) => {
      expect(response.status).to.equal(200)
      expect(response.headers['cache-control']).to.contain('no-store')

      const configured = /IDP_LOGIN_URI:\s*'([^']+)'/.exec(String(response.body))?.[1] ?? ''
      expect(new URL(configured).pathname).to.equal('/login.html')
      expect(new URL(configured).port).to.equal('8080')
    })
  })
})
