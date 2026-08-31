describe('Navigation Drawer', () => {
  const journeyBody = {
    _id: '507f1f77bcf86cd799439011',
    profile_id: '507f1f77bcf86cd799439011',
    profile: {
      _id: '507f1f77bcf86cd799439011',
      full_name: 'Jane Mentee',
      email: 'jane@example.com',
    },
    status: 'active',
    later: [],
    next: [],
    now: [],
    library: [],
  }

  const openDrawer = () => {
    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible').click()
  }

  const assertAlbHref = (automationId: string, pathname: string) => {
    cy.get(`[data-automation-id="${automationId}"]`).should(($link) => {
      const href = $link.attr('href')
      expect(href).to.eq(`http://localhost:8080${pathname}`)
      expect(href).not.to.include(':8394')
      expect(href).not.to.include('/mentee/mentee')
    })
  }

  it('renders PageFrame chrome and mentee-only drawer rows', () => {
    cy.login(['mentee'])
    cy.visit('/mentee/')

    cy.get('[data-automation-id="page-frame-title"]').should('be.visible')
    assertAlbHref('nav-profile-link', '/customer/profile/')

    openDrawer()
    assertAlbHref('nav-home-link', '/discovery/')
    assertAlbHref('nav-notifications-link', '/discovery/notifications')
    cy.get('[data-automation-id="nav-products-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-settings-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-logout-link"]').scrollIntoView().should('be.visible')
  })

  it('shows admin catalog rows for an admin login', () => {
    cy.login(['admin'])
    cy.visit('/mentee/')
    openDrawer()

    assertAlbHref('nav-home-link', '/discovery/')
    assertAlbHref('nav-notifications-link', '/discovery/notifications')
    assertAlbHref('nav-products-link', '/discovery/products')
    assertAlbHref('nav-settings-link', '/admin/settings')
  })

  it('shows Mentee before the journey resolves then full_name:Mentee', () => {
    cy.intercept('GET', '**/api/journey', {
      delay: 2000,
      body: journeyBody,
    }).as('getJourney')
    cy.login(['mentee'])

    cy.get('[data-automation-id="page-frame-title"]')
      .should('be.visible')
      .and('contain', 'Mentee')
      .and('not.contain', 'Jane Mentee')
    cy.wait('@getJourney')
    cy.get('[data-automation-id="page-frame-title"]').should('contain', 'Jane Mentee:Mentee')
  })

  it('should logout and redirect to IdP login', () => {
    cy.login(['mentee'])
    cy.visit('/mentee/')
    openDrawer()
    cy.get('[data-automation-id="nav-logout-link"]').scrollIntoView().click()

    cy.origin('http://127.0.0.1:8080', () => {
      cy.location('pathname', { timeout: 10000 }).should('eq', '/login.html')
      cy.location('search').should('include', 'return_to=')
    })
  })
})
