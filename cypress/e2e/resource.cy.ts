describe('Resource Domain', () => {
  const resourceDetailBody = {
    resource: {
      _id: 'resource-1',
      name: 'First Resource',
      description: 'First description',
      status: 'active',
      url: 'https://example.com/resource',
      type: 'article',
      cost: 'free',
      skill_level: 'Apprentice',
      interests: ['api'],
      technologies: ['Python'],
      created: {
        from_ip: '127.0.0.1',
        by_user: 'admin-user',
        at_time: '2024-01-01T00:00:00Z',
        correlation_id: 'resource-created',
      },
      saved: {
        from_ip: '127.0.0.1',
        by_user: 'admin-user',
        at_time: '2024-01-02T00:00:00Z',
        correlation_id: 'resource-saved',
      },
    },
    aggregation: {
      _id: 'aggregation-1',
      resource_id: 'resource-1',
      note_count: 1,
      completions: 5,
      hits: 12,
      duration: 'PT2H30M',
      rating_count: 5,
      rating_sum: 20,
      created: {
        from_ip: '127.0.0.1',
        by_user: 'system',
        at_time: '2024-01-01T00:00:00Z',
        correlation_id: 'abc',
      },
      last_saved: {
        from_ip: '127.0.0.1',
        by_user: 'system',
        at_time: '2024-01-02T00:00:00Z',
        correlation_id: 'def',
      },
    },
    notes: [
      {
        _id: 'note-1',
        resource_id: 'resource-1',
        note: 'Helpful resource for learning async patterns.',
        status: 'active',
      },
    ],
  }

  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '**/api/resource/resource-1', resourceDetailBody).as('getResource')
  })

  it('should display a resource in read-only typed editors', () => {
    cy.visit('/resources/resource-1')
    cy.wait('@getResource')
    cy.get('[data-automation-id="resource-view-card"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-card-collapse-button"]').should('not.exist')
    cy.get('[data-automation-id="resource-view-card-title-display"]').should('contain.text', 'Resource First Resource')
    cy.get('[data-automation-id="resource-view-description-display"]').should('contain.text', 'First description')
    cy.get('[data-automation-id="resource-view-url-display"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-admin-card"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-admin-card-collapse-button"]').click()
    cy.get('[data-automation-id="resource-view-status-display"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-created-from-ip-display"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-saved-from-ip-display"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-browse-resources-link"]').should('be.visible')
  })

  it('should render resource names with spaces and long descriptions from the OpenAPI contract', () => {
    const longDescription = 'A'.repeat(500)
    cy.intercept('GET', '**/api/resource/resource-1', {
      ...resourceDetailBody,
      resource: {
        ...resourceDetailBody.resource,
        name: 'Intro to Async Patterns',
        description: longDescription,
      },
    }).as('getResourceWithLongFields')

    cy.visit('/resources/resource-1')
    cy.wait('@getResourceWithLongFields')

    cy.get('[data-automation-id="resource-view-card-title-display"]').should(
      'contain.text',
      'Resource Intro to Async Patterns'
    )
    cy.get('[data-automation-id="resource-view-description-display"]').should('contain.text', longDescription)
  })

  it('should hide administration card from non-admin users', () => {
    cy.login(['mentee'])
    cy.visit('/resources/resource-1')
    cy.wait('@getResource')

    cy.get('[data-automation-id="resource-view-admin-card"]').should('not.exist')
    cy.get('[data-automation-id="resource-view-status-display"]').should('not.exist')
    cy.get('[data-automation-id="resource-view-created-from-ip-display"]').should('not.exist')
  })

  it('should show aggregation and notes sections on the resource card', () => {
    cy.visit('/resources/resource-1')
    cy.wait('@getResource')

    cy.get('[data-automation-id="resource-view-aggregation-heading"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-notes-heading"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-aggregation-average-rating-display"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-aggregation-average-rating-display"] .v-rating').should('be.visible')
    cy.get('[data-automation-id="resource-view-aggregation-hits-display"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-aggregation-completions-display"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-aggregation-duration-display"]')
      .should('be.visible')
      .and('contain.text', 'Average Duration')
      .and('contain.text', '30 minutes')
    cy.get('[data-automation-id="resource-view-notes-list"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-note-0-text-display"]')
      .should('contain.text', 'Helpful resource for learning async patterns.')
  })

  it('should keep the administration sub-card collapsed by default', () => {
    cy.visit('/resources/resource-1')
    cy.wait('@getResource')

    cy.get('[data-automation-id="resource-view-admin-card"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-admin-card"]').should('have.class', 'mh-card--collapsed')
    cy.get('[data-automation-id="resource-view-status-display"]').should('not.be.visible')
  })
})

