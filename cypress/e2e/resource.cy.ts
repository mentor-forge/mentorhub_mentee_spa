describe('Resource Domain', () => {
  const gridSelector = '[data-automation-id="resource-list-grid"]'
  const firstCardSelector = '[data-automation-id="resource-list-resource-resource-1-card"]'
  const secondCardSelector = '[data-automation-id="resource-list-resource-resource-2-card"]'
  const searchSelector = '[data-automation-id="resource-list-search"] input'

  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '**/api/resource*', (request) => {
      const isNextPage = request.query.after_id === 'resource-1'
      request.reply({
        items: isNextPage
          ? [{ _id: 'resource-2', name: 'Second Resource', description: 'Second description', status: 'active' }]
          : [{ _id: 'resource-1', name: 'First Resource', description: 'First description', status: 'active' }],
        limit: 20,
        has_more: !isNextPage,
        next_cursor: isNextPage ? null : 'resource-1',
      })
    }).as('getResources')
    cy.intercept('GET', '**/api/resource/resource-1', {
      _id: 'resource-1',
      name: 'First Resource',
      description: 'First description',
      status: 'active',
    }).as('getResource')
  })

  it('should display resources list page', () => {
    cy.visit('/resources')
    cy.get('[data-automation-id="resource-list-heading"]').should('be.visible')
    cy.get(gridSelector).should('exist')
    cy.get(firstCardSelector).should('be.visible')
  })

  it('should search resources using card list controls', () => {
    cy.visit('/resources')

    cy.get(searchSelector).should('be.visible').type('first')
    cy.wait('@getResources')
    cy.get(firstCardSelector).should('be.visible')
  })

  it('should load more resource cards through the shared control', () => {
    cy.visit('/resources')

    cy.get('[data-automation-id="resource-list-load-more"]').should('be.visible').click()
    cy.wait('@getResources')
    cy.get(secondCardSelector).should('be.visible')
  })

  it('should display a resource in read-only typed editors', () => {
    cy.visit('/resources')

    cy.get('[data-automation-id="resource-list-resource-resource-1-view-button"]').click()
    cy.wait('@getResource')
    cy.get('[data-automation-id="resource-view-heading"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-grid"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-card"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-name-display"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-description-display"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-status-display"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-back-to-list-button"]').should('be.visible')
  })
})
