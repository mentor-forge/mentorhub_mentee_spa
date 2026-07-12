describe('Navigation Drawer', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should open navigation drawer with hamburger menu', () => {
    cy.visit('/journey')
    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()

    cy.get('[data-automation-id="nav-journey-link"]').should('be.visible')
    cy.get('[data-automation-id="nav-paths-link"]').should('be.visible')
    cy.get('[data-automation-id="nav-resources-link"]').should('be.visible')
  })

  it('should not show removed domain links in drawer', () => {
    cy.visit('/journey')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()

    cy.get('[data-automation-id="nav-journeys-list-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-ratings-list-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-notes-list-link"]').should('not.exist')
    cy.get('[data-automation-id="nav-events-list-link"]').should('not.exist')
  })

  it('should have admin and logout at bottom of drawer', () => {
    cy.login(['admin'])
    cy.visit('/journey')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()

    cy.get('[data-automation-id="nav-admin-link"]').scrollIntoView().should('be.visible')
    cy.get('[data-automation-id="nav-logout-link"]').scrollIntoView().should('be.visible')
  })

  it('should navigate to paths from drawer', () => {
    cy.visit('/journey')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()

    cy.get('[data-automation-id="nav-paths-link"]').click()
    cy.url().should('include', '/paths')
  })

  it('should navigate to resources from drawer', () => {
    cy.visit('/journey')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()

    cy.get('[data-automation-id="nav-resources-link"]').click()
    cy.url().should('include', '/resources')
  })

  it('should close drawer after navigation', () => {
    cy.visit('/journey')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()

    cy.get('[data-automation-id="nav-paths-link"]').click()

    cy.wait(500)
    cy.get('[data-automation-id="nav-paths-link"]').should('not.be.visible')
  })
})
