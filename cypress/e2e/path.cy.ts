describe('Path Domain', () => {
  const gridSelector = '[data-automation-id="path-list-grid"]'
  const cardSelector = `${gridSelector} [data-automation-id$="-card"]`
  const searchSelector = '[data-automation-id="path-list-search"] input'

  beforeEach(() => {
    cy.login()
  })

  it('should display paths list page', () => {
    cy.visit('/paths')
    cy.get('h1').contains('Paths').should('be.visible')
    cy.get(gridSelector).should('exist')
  })

  it('should search paths using card list controls', () => {
    cy.visit('/paths')

    cy.get(gridSelector).should('exist')
    cy.get(searchSelector).should('exist').type('nonexistent-search-term-xyz')
    cy.wait(800)
    cy.get(gridSelector).should('exist')
    cy.get(searchSelector).clear()
    cy.wait(800)
    cy.get(gridSelector).should('exist')
  })

  it('should expose card actions for loaded paths', () => {
    cy.visit('/paths')

    cy.get(gridSelector).should('exist')
    cy.get('body').then(($body) => {
      if ($body.find(cardSelector).length > 0) {
        cy.get(cardSelector).first().within(() => {
          cy.get('[data-automation-id$="-view-button"]').should('exist')
        })
      }
    })
  })

  it('should display a path in read-only typed editors', () => {
    cy.visit('/paths')

    cy.get(gridSelector).should('exist')
    cy.get('body').then(($body) => {
      if ($body.find(cardSelector).length > 0) {
        cy.get(cardSelector).first().find('[data-automation-id$="-view-button"]').click()
        cy.get('[data-automation-id="path-view-grid"]').should('be.visible')
        cy.get('[data-automation-id="path-view-card"]').should('be.visible')
        cy.get('[data-automation-id="path-view-name-display"]').should('be.visible')
        cy.get('[data-automation-id="path-view-description-display"]').should('be.visible')
        cy.get('[data-automation-id="path-view-status-display"]').should('be.visible')
        cy.get('[data-automation-id="path-view-back-to-list-button"]').should('be.visible')
      }
    })
  })

  it('should not have a new path button (read-only)', () => {
    cy.visit('/paths')
    cy.get('button').contains('New Path').should('not.exist')
  })
})
