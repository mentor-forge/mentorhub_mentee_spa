describe('Resource Domain', () => {
  const gridSelector = '[data-automation-id="resource-list-grid"]'
  const firstCardSelector = '[data-automation-id="resource-list-resource-resource-1-card"]'
  const secondCardSelector = '[data-automation-id="resource-list-resource-resource-2-card"]'
  const searchSelector = '[data-automation-id="resource-list-search"] input'
  const searchFieldSelector = '[data-automation-id="resource-list-search-field-select"]'

  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '**/api/resource*', (request) => {
      const isNextPage = request.headers.offset === '20'
      const firstPage = [
        { _id: 'resource-1', name: 'First Resource', description: 'First description', status: 'active' },
        ...Array.from({ length: 19 }, (_, index) => ({
          _id: `resource-filler-${index}`,
          name: `Resource ${index + 2}`,
          description: 'Filler description',
          status: 'active',
        })),
      ]
      const searchFields = ['name', 'description', 'url', 'interests', 'technologies', 'skill_level']
      const hasSearchFilter = searchFields.some((field) => Boolean(request.query[field]))

      request.reply(
        isNextPage
          ? [{ _id: 'resource-2', name: 'Second Resource', description: 'Second description', status: 'active' }]
          : hasSearchFilter
            ? [firstPage[0]]
            : firstPage
      )
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

  it('should search resources by name', () => {
    cy.visit('/resources')
    cy.wait('@getResources')

    cy.get(searchSelector).should('be.visible').type('first')
    cy.wait('@getResources').its('request.query.name').should('eq', 'first')
    cy.get(firstCardSelector).should('be.visible')
  })

  ;[
    { field: 'description', label: 'Description' },
    { field: 'url', label: 'URL' },
    { field: 'interests', label: 'Interests' },
    { field: 'technologies', label: 'Technologies' },
    { field: 'skill_level', label: 'Skill level' },
  ].forEach(({ field, label }) => {
    it(`should search resources by ${label}`, () => {
      cy.visit('/resources')
      cy.wait('@getResources')

      cy.get(searchFieldSelector).click()
      cy.contains('[role="option"]', label).click()
      cy.wait('@getResources')
      cy.get(searchSelector).should('be.visible').type('filter-value')
      cy.wait('@getResources').its(`request.query.${field}`).should('eq', 'filter-value')
      cy.get(firstCardSelector).should('be.visible')
    })
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
