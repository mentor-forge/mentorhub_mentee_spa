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
    cy.get('[data-automation-id="journey-profile-id-field-display"]').should('be.visible')
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

  it('should update journey status from runtime enum values via auto-save', () => {
    cy.intercept('PATCH', '**/api/journey/**').as('updateJourney')
    cy.visit('/journey')

    cy.get('[data-automation-id="journey-edit-status-select"]').then(($select) => {
      const isActive = $select.text().includes('Not Deleted')
      const optionLabel = isActive ? 'Soft Delete Indicator' : 'Not Deleted'
      const optionValue = isActive ? 'archived' : 'active'

      cy.wrap($select).click()
      cy.get('.v-overlay-container').contains(optionLabel).click()
      cy.get('[data-automation-id="journey-edit-status-select"]').find('input').focus().blur()

      cy.wait('@updateJourney').its('request.body').should('deep.equal', { status: optionValue })
      cy.get('[data-automation-id="journey-edit-status-select"]').should('contain', optionLabel)
    })
  })
})
