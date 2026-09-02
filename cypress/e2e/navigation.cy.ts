/**
 * Navigation chrome coverage for the spa_utils `PageFrame` 1.0.1 catalog under `/mentee/`.
 *
 * Every automation id asserted here is compiled into `@mentor-forge/mentorhub_spa_utils`
 * (`nav-drawer-toggle`, `page-frame-title`, `nav-profile-link`, `nav-home-link`,
 * `nav-events-link`, `nav-notifications-link`, `nav-settings-link`, `nav-logout-link`).
 * This SPA defines no `nav-*` id of its own.
 *
 * Removed hamburger ids (`nav-products-link`, `nav-customer-link`,
 * `nav-customer-members-link`) must stay absent for every role checked.
 *
 * This SPA does not host Events — assert `nav-events-link` href only.
 * `cy.login()` with no argument seeds an **admin** token; roles are picked deliberately.
 */
describe('Navigation (spa_utils PageFrame)', () => {
  const APP_ORIGIN = Cypress.config('baseUrl') as string
  const JOURNEY_PATHNAME = '/mentee/journey'
  const CONFIG_PATHNAME = '/mentee/config'
  const IDP_STUB_PATHNAME = '/login.html'
  const SETTINGS_HREF = `${APP_ORIGIN}${CONFIG_PATHNAME}`

  const removedCatalogIds = [
    'nav-products-link',
    'nav-customer-link',
    'nav-customer-members-link',
  ]

  const journeyBody = {
    _id: '507f1f77bcf86cd799439011',
    profile_id: '507f1f77bcf86cd799439011',
    profile: {
      _id: '507f1f77bcf86cd799439011',
      full_name: 'Jane Mentee',
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

  function openDrawer() {
    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible').click({ force: true })
    cy.get('.v-navigation-drawer', { timeout: 5000 }).should('be.visible')
  }

  /** Ordered automation ids of the catalog rows (the drawer's first list, above the divider). */
  function drawerCatalogIds() {
    return cy
      .get('.v-navigation-drawer .v-list')
      .first()
      .find('[data-automation-id]')
      .then(($rows) => [...$rows].map((row) => row.getAttribute('data-automation-id') ?? ''))
  }

  function assertRemovedCatalogRows() {
    removedCatalogIds.forEach((automationId) => {
      cy.get(`[data-automation-id="${automationId}"]`).should('not.exist')
    })
  }

  function assertAlbHref(automationId: string, expectedPath: string) {
    cy.get(`[data-automation-id="${automationId}"]`)
      .should('match', 'a')
      .and('have.attr', 'href')
      .then((href) => {
        const url = new URL(String(href))
        expect(url.port, `${automationId} port`).to.equal('8080')
        expect(url.pathname, `${automationId} pathname`).to.equal(expectedPath)
        expect(String(href)).not.to.include(':8394')
        expect(String(href)).not.to.include('/mentee/mentee')
      })
  }

  function assertHostingSettingsHref() {
    cy.get('[data-automation-id="nav-settings-link"]')
      .should('have.attr', 'href', SETTINGS_HREF)
      .and(($link) => {
        const href = $link.attr('href') ?? ''
        expect(href).to.include(':8394')
        expect(href).not.to.include(':8080')
        expect(href).not.to.include('/admin/settings')
        expect(href).not.to.include('/mentee/mentee')
      })
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

  it('should show the hamburger and the customer profile link when authenticated', () => {
    stubJourney()
    cy.login(['mentee'])

    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible')
    assertAlbHref('nav-profile-link', '/customer/profile/')
  })

  it('should show Mentee in the title', () => {
    stubJourney()
    cy.login(['mentee'])

    cy.get('[data-automation-id="page-frame-title"]')
      .invoke('text')
      .invoke('trim')
      .should('equal', 'Mentee')
  })

  it('should show only Home and Events for a mentee-only login', () => {
    stubJourney()
    cy.login(['mentee'])
    openDrawer()

    drawerCatalogIds().should('deep.equal', ['nav-home-link', 'nav-events-link'])
    assertAlbHref('nav-home-link', '/discovery/')
    assertAlbHref('nav-events-link', '/discovery/events')
    cy.get('[data-automation-id="nav-notifications-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-settings-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-resources-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-paths-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-plans-link"]').should('not.exist')
    assertRemovedCatalogRows()
    cy.get('[data-automation-id="nav-logout-link"]').should('be.visible')
  })

  it('should show only admin catalog rows and host Settings at /mentee/config', () => {
    stubJourney()
    stubAdminConfig()
    cy.login(['admin'])
    openDrawer()

    drawerCatalogIds().should('deep.equal', [
      'nav-home-link',
      'nav-events-link',
      'nav-notifications-link',
      'nav-settings-link',
    ])
    assertAlbHref('nav-home-link', '/discovery/')
    assertAlbHref('nav-events-link', '/discovery/events')
    assertAlbHref('nav-notifications-link', '/discovery/notifications')
    cy.get('[data-automation-id="nav-resources-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-paths-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-plans-link"]').should('not.exist')
    assertRemovedCatalogRows()
    assertHostingSettingsHref()

    cy.get('[data-automation-id="nav-settings-link"]').click()
    cy.wait('@getAdminConfig')
    cy.location('origin').should('eq', APP_ORIGIN)
    cy.location('pathname').should('eq', CONFIG_PATHNAME)
    cy.url().should('not.include', '/mentee/mentee')

    cy.get('[data-automation-id="admin-tab-token"]').click()
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

  it('should show only Home and Events for a customer-only login', () => {
    stubJourney()
    cy.login(['customer'])
    openDrawer()

    drawerCatalogIds().should('deep.equal', ['nav-home-link', 'nav-events-link'])
    assertAlbHref('nav-home-link', '/discovery/')
    assertAlbHref('nav-events-link', '/discovery/events')
    cy.get('[data-automation-id="nav-notifications-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-settings-link"]').should('not.exist')
    assertRemovedCatalogRows()
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
    // Plain `cy.visit`: the guard `location.replace`s to `:8080/discovery/`.
    // Cypress cannot follow that the way Discovery follows same-origin Home —
    // prove the unload at the origin boundary. Do not add a local Home fallback.
    cy.visit(CONFIG_PATHNAME)

    cy.origin('http://localhost:8080', () => {
      cy.location('href', { timeout: 10000 }).should('include', '/discovery/')
      cy.location('pathname').should('not.eq', '/mentee/config')
      cy.get('[data-automation-id="admin-tab-token"]').should('not.exist')
      cy.get('[data-automation-id="admin-tab-config"]').should('not.exist')
    })
  })

  it('should close the drawer when the toggle is clicked again', () => {
    stubJourney()
    cy.login(['mentee'])
    openDrawer()

    cy.get('[data-automation-id="nav-drawer-toggle"]').click({ force: true })
    cy.wait(500)
    cy.get('.v-navigation-drawer', { timeout: 5000 }).should('not.be.visible')
  })

  it('should clear auth and leave for the IdP login URL on logout', () => {
    stubJourney()
    stubIdpLoginUri()
    cy.login(['mentee'])

    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible')
    openDrawer()
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
    // Plain `cy.visit`: the guard leaves for the IdP during bootstrap, so by the time
    // `cy.visitPrefixed` could read the navigation entry the document is the IdP stub.
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
