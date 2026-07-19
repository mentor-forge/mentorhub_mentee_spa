describe('Resource Domain', () => {
  const gridSelector = '[data-automation-id="resource-list-grid"]'
  const cardSelector = `${gridSelector} [data-automation-id$="-card"]`
  const searchSelector = '[data-automation-id="resource-list-search"] input'

  beforeEach(() => {
    cy.login()
  })

  it('should display resources list page', () => {
    cy.visit('/resources')
    cy.get('h1').contains('Resources').should('be.visible')
    cy.get(gridSelector).should('exist')
  })

  it('should search resources using card list controls', () => {
    cy.visit('/resources')

    cy.get(gridSelector).should('exist')
    cy.get(searchSelector).should('exist').type('nonexistent-search-term-xyz')
    cy.wait(800)
    cy.get(gridSelector).should('exist')
    cy.get(searchSelector).clear()
    cy.wait(800)
    cy.get(gridSelector).should('exist')
  })

  it('should expose card actions for loaded resources', () => {
    cy.visit('/resources')

    cy.get(gridSelector).should('exist')
    cy.get('body').then(($body) => {
      if ($body.find(cardSelector).length > 0) {
        cy.get(cardSelector).first().within(() => {
          cy.get('[data-automation-id$="-view-button"]').should('exist')
        })
      }
    })
  })

  it('should display a resource in read-only typed editors', () => {
    cy.visit('/resources')

    cy.get(gridSelector).should('exist')
    cy.get('body').then(($body) => {
      if ($body.find(cardSelector).length > 0) {
        cy.get(cardSelector).first().find('[data-automation-id$="-view-button"]').click()
        cy.get('[data-automation-id="resource-view-grid"]').should('be.visible')
        cy.get('[data-automation-id="resource-view-card"]').should('be.visible')
        cy.get('[data-automation-id="resource-view-name-display"]').should('be.visible')
        cy.get('[data-automation-id="resource-view-description-display"]').should('be.visible')
        cy.get('[data-automation-id="resource-view-status-display"]').should('be.visible')
        cy.get('[data-automation-id="resource-view-back-to-list-button"]').should('be.visible')
      }
    })
  })

  it('should not have a new resource button (read-only)', () => {
    cy.visit('/resources')
    cy.get('button').contains('New Resource').should('not.exist')
  })
})
