describe('Path Domain', () => {
  const gridSelector = '[data-automation-id="path-list-grid"]'
  const firstCardSelector = '[data-automation-id="path-list-path-path-1-card"]'
  const secondCardSelector = '[data-automation-id="path-list-path-path-2-card"]'
  const searchSelector = '[data-automation-id="path-list-search"] input'

  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '**/api/path*', (request) => {
      const isNextPage = request.headers.offset === '20'
      const firstPage = [
        { _id: 'path-1', name: 'First Path', description: 'First description', status: 'active' },
        ...Array.from({ length: 19 }, (_, index) => ({
          _id: `path-filler-${index}`,
          name: `Path ${index + 2}`,
          description: 'Filler description',
          status: 'active',
        })),
      ]
      request.reply(
        isNextPage
          ? [{ _id: 'path-2', name: 'Second Path', description: 'Second description', status: 'active' }]
          : request.query.name
            ? [firstPage[0]]
            : firstPage
      )
    }).as('getPaths')
    cy.intercept('GET', '**/api/path/path-1', {
      _id: 'path-1',
      name: 'First Path',
      description: 'First description',
      status: 'active',
    }).as('getPath')
  })

  it('should display paths list page', () => {
    cy.visit('/paths')
    cy.get('[data-automation-id="path-list-heading"]').should('be.visible')
    cy.get(gridSelector).should('exist')
    cy.get(firstCardSelector).should('be.visible')
  })

  it('should search paths using card list controls', () => {
    cy.visit('/paths')

    cy.get(searchSelector).should('be.visible').type('first')
    cy.wait('@getPaths')
    cy.get(firstCardSelector).should('be.visible')
  })

  it('should load more path cards through the shared control', () => {
    cy.visit('/paths')

    cy.get('[data-automation-id="path-list-load-more"]').should('be.visible').click()
    cy.wait('@getPaths')
    cy.get(secondCardSelector).should('be.visible')
  })

  it('should display a path in read-only typed editors', () => {
    cy.visit('/paths')

    cy.get('[data-automation-id="path-list-path-path-1-view-button"]').click()
    cy.wait('@getPath')
    cy.get('[data-automation-id="path-view-heading"]').should('be.visible')
    cy.get('[data-automation-id="path-view-grid"]').should('be.visible')
    cy.get('[data-automation-id="path-view-card"]').should('be.visible')
    cy.get('[data-automation-id="path-view-name-display"]').should('be.visible')
    cy.get('[data-automation-id="path-view-description-display"]').should('be.visible')
    cy.get('[data-automation-id="path-view-status-display"]').should('be.visible')
    cy.get('[data-automation-id="path-view-back-to-list-button"]').should('be.visible')
  })
})
