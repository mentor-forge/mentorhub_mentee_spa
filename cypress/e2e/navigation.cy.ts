/**
 * Navigation chrome coverage for the spa_utils `PageFrame` shell under the `/mentee/` base.
 *
 * Every automation id asserted here is compiled into `@mentor-forge/mentorhub_spa_utils`
 * (`nav-drawer-toggle`, `page-frame-title`, `nav-profile-link`, `nav-home-link`,
 * `nav-notifications-link`, `nav-products-link`, `nav-settings-link`, `nav-logout-link`).
 * This SPA defines no `nav-*` id of its own.
 *
 * Role-gated rows are asserted as an exact, ordered id list read from the DOM rather than
 * by naming every absent row, because `cy.login()` with no argument seeds an **admin**
 * token: a bare `cy.login()` would show Products and Settings too.
 */
describe('Navigation (spa_utils PageFrame)', () => {
  const APP_ORIGIN = Cypress.config('baseUrl') as string
  const JOURNEY_PATHNAME = '/mentee/journey'
  const IDP_STUB_PATHNAME = '/login.html'

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

  function assertAlbHref(automationId: string, expectedPath: string) {
    cy.get(`[data-automation-id="${automationId}"]`)
      .should('match', 'a')
      .and('have.attr', 'href')
      .then((href) => {
        const url = new URL(String(href))
        expect(url.port, `${automationId} port`).to.equal('8080')
        expect(url.pathname, `${automationId} pathname`).to.equal(expectedPath)
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

  it('should show Mentee in the title before the journey resolves and the full name after', () => {
    cy.intercept('GET', '**/mentee/api/journey', { body: journeyBody, delay: 3000 }).as(
      'getSlowJourney'
    )
    cy.login(['mentee'])

    cy.get('[data-automation-id="page-frame-title"]')
      .invoke('text')
      .invoke('trim')
      .should('equal', 'Mentee')
    cy.wait('@getSlowJourney')
    cy.get('[data-automation-id="page-frame-title"]')
      .invoke('text')
      .invoke('trim')
      .should('equal', 'Jane Mentee:Mentee')
  })

  it('should show only Home and Notifications for a plain mentee token', () => {
    stubJourney()
    cy.login(['mentee'])
    openDrawer()

    drawerCatalogIds().should('deep.equal', ['nav-home-link', 'nav-notifications-link'])
    assertAlbHref('nav-home-link', '/discovery/')
    assertAlbHref('nav-notifications-link', '/discovery/notifications')
    cy.get('[data-automation-id="nav-logout-link"]').should('be.visible')
  })

  it('should add the role-gated Products and Settings rows for an admin token', () => {
    stubJourney()
    cy.login(['admin'])
    openDrawer()

    drawerCatalogIds().should('deep.equal', [
      'nav-home-link',
      'nav-products-link',
      'nav-notifications-link',
      'nav-settings-link',
    ])
    assertAlbHref('nav-products-link', '/discovery/products')
    assertAlbHref('nav-settings-link', '/admin/settings')
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

    // `PageFrame` returns to the ROOT origin, not `/mentee/` (recorded spa_utils limitation),
    // so only the IdP pathname and the presence of `return_to` are asserted.
    cy.location('pathname', { timeout: 10000 }).should('eq', IDP_STUB_PATHNAME)
    cy.location('search').should('include', 'return_to=')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('access_token')).to.equal(null)
      expect(win.localStorage.getItem('user_roles')).to.equal(null)
    })
  })

  it('should return an unauthenticated deep link to its prefixed URL after login', () => {
    stubIdpLoginUri()
    // Plain `cy.visit`: the guard leaves for the IdP during bootstrap, so by the time
    // `cy.visitPrefixed` could read the navigation entry the document is the IdP stub.
    cy.visit('/mentee/paths/path-1')

    cy.location('pathname', { timeout: 10000 }).should('eq', IDP_STUB_PATHNAME)
    cy.location('search').then((search) => {
      const returnTo = new URLSearchParams(search).get('return_to') ?? ''
      expect(new URL(returnTo).pathname).to.equal('/mentee/paths/path-1')
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
