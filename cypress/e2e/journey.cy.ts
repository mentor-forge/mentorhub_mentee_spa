describe('Journey Page', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should land on journey page from default route', () => {
    cy.visit('/')
    cy.url().should('include', '/journey')
    cy.get('h1').contains('Journey').should('be.visible')
  })

  it('should load journey content from API', () => {
    cy.visit('/journey')
    cy.get('[data-automation-id="journey-edit-status-select"]').should('be.visible')
    cy.get('[data-automation-id="journey-profile-id-field"]').should('be.visible')
    cy.get('[data-automation-id="journey-now-count"]').should('be.visible')
    cy.get('[data-automation-id="journey-next-count"]').should('be.visible')
    cy.get('[data-automation-id="journey-library-count"]').should('be.visible')
  })

  it('should navigate to journey from drawer', () => {
    cy.visit('/paths')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()
    cy.get('[data-automation-id="nav-journey-link"]').click()
    cy.url().should('include', '/journey')
    cy.get('h1').contains('Journey').should('be.visible')
  })

  it('should update journey status via auto-save', () => {
    cy.visit('/journey')

    cy.get('[data-automation-id="journey-edit-status-select"]').click()
    cy.get('.v-list-item').contains('archived').click()
    cy.wait(1000)

    cy.get('[data-automation-id="journey-edit-status-select"]').should('contain', 'archived')
  })
})
