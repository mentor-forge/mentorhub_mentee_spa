describe('Navigation Drawer', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should open navigation drawer with hamburger menu', () => {
    cy.visit('/journeys')
    cy.get('[data-automation-id="nav-drawer-toggle"]').should('be.visible')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()
    
    // Check that drawer is visible with domain sections
    cy.contains('JOURNEY DOMAIN').should('be.exist')
    cy.contains('RATING DOMAIN').should('be.exist')
    cy.contains('NOTE DOMAIN').should('be.exist')
    cy.contains('EVENT DOMAIN').should('be.exist')
    cy.contains('RESOURCE DOMAIN').should('be.exist')
    cy.contains('PATH DOMAIN').should('be.exist')
  })
  it('should have all journey domain links in drawer', () => {
    cy.visit('/journeys')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()
    
    cy.get('[data-automation-id="nav-journeys-list-link"]').scrollIntoView().should('be.visible')
    cy.get('[data-automation-id="nav-journeys-new-link"]').scrollIntoView().should('be.visible')
  })
  it('should have all rating domain links in drawer', () => {
    cy.visit('/ratings')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()
    
    cy.get('[data-automation-id="nav-ratings-list-link"]').scrollIntoView().should('be.visible')
    cy.get('[data-automation-id="nav-ratings-new-link"]').scrollIntoView().should('be.visible')
  })
  it('should have all note domain links in drawer', () => {
    cy.visit('/notes')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()
    
    cy.get('[data-automation-id="nav-notes-list-link"]').scrollIntoView().should('be.visible')
    cy.get('[data-automation-id="nav-notes-new-link"]').scrollIntoView().should('be.visible')
  })
  it('should have all event domain links in drawer', () => {
    cy.visit('/journeys')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()
    
    cy.get('[data-automation-id="nav-events-list-link"]').scrollIntoView().should('be.visible')
    cy.get('[data-automation-id="nav-events-new-link"]').scrollIntoView().should('be.visible')
  })
  it('should have resource domain link in drawer', () => {
    cy.visit('/journeys')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()
    
    cy.get('[data-automation-id="nav-resources-list-link"]').scrollIntoView().should('be.visible')
  })
  it('should have path domain link in drawer', () => {
    cy.visit('/journeys')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()
    
    cy.get('[data-automation-id="nav-paths-list-link"]').scrollIntoView().should('be.visible')
  })

  it('should have admin and logout at bottom of drawer', () => {
    // Login with admin role to see admin link
    cy.login(['admin'])
    cy.visit('/journeys')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()
    
    // Admin and Logout should be visible in the drawer
    cy.get('[data-automation-id="nav-admin-link"]').scrollIntoView().should('be.visible')
    cy.get('[data-automation-id="nav-logout-link"]').scrollIntoView().should('be.visible')
  })

  it('should navigate to different pages from drawer', () => {
    cy.visit('/journeys')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()
    
    cy.get('[data-automation-id="nav-events-list-link"]').scrollIntoView().click()
    cy.url().should('include', '/events')
  })

  it('should close drawer after navigation', () => {
    cy.visit('/journeys')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()
    
    cy.get('[data-automation-id="nav-events-list-link"]').scrollIntoView().click()
    
    // Drawer should close after navigation (temporary drawer)
    cy.wait(500)
    cy.contains('JOURNEY DOMAIN').should('not.be.visible')
  })
})