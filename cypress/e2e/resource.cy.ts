describe('Resource Domain', () => {
  const gridSelector = '[data-automation-id="resource-list-grid"]'
  const firstCardSelector = '[data-automation-id="resource-list-resource-resource-1-card"]'
  const secondCardSelector = '[data-automation-id="resource-list-resource-resource-2-card"]'
  const searchSelector = '[data-automation-id="resource-list-search"] input'
  const searchFieldSelector = '[data-automation-id="resource-list-search-field-select"]'

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
    aggregation: null,
    notes: [],
  }

  const aggregationDetailBody = {
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
    cy.intercept('GET', '**/api/resource*', (request) => {
      if (request.url.match(/\/api\/resource\/[^/?]+$/)) {
        request.reply(resourceDetailBody)
        return
      }

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
    cy.intercept('GET', '**/api/resource/resource-1', resourceDetailBody).as('getResource')
    cy.intercept('GET', '**/api/aggregation/resource-1', aggregationDetailBody).as('getAggregation')
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
    cy.get('[data-automation-id="resource-view-card"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-name-display"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-description-display"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-admin-card"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-status-display"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-created-from-ip-display"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-saved-from-ip-display"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-back-to-list-button"]').should('be.visible')
  })

  it('should hide administration card from non-admin users', () => {
    cy.login(['mentee'])
    cy.visit('/resources/resource-1')
    cy.wait('@getResource')

    cy.get('[data-automation-id="resource-view-admin-card"]').should('not.exist')
    cy.get('[data-automation-id="resource-view-status-display"]').should('not.exist')
    cy.get('[data-automation-id="resource-view-created-from-ip-display"]').should('not.exist')
  })

  it('should keep aggregation and notes sub-cards collapsed by default', () => {
    cy.visit('/resources/resource-1')
    cy.wait('@getResource')

    cy.get('[data-automation-id="resource-view-aggregation-card"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-notes-card"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-aggregation-card"]').should('have.class', 'mh-card--collapsed')
    cy.get('[data-automation-id="resource-view-notes-card"]').should('have.class', 'mh-card--collapsed')
    cy.get('[data-automation-id="resource-view-aggregation-note-count-display"]').should('not.exist')
    cy.get('[data-automation-id="resource-view-notes-list"]').should('not.exist')
    cy.get('[data-automation-id="resource-view-notes-empty"]').should('not.exist')
  })

  it('should lazy-load aggregation metrics when the aggregation sub-card expands', () => {
    cy.visit('/resources/resource-1')
    cy.wait('@getResource')

    cy.get('[data-automation-id="resource-view-aggregation-card-collapse-button"]').click()
    cy.wait('@getAggregation')
    cy.get('[data-automation-id="resource-view-aggregation-note-count-display"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-aggregation-completions-display"]').should('be.visible')
  })

  it('should lazy-load notes when the notes sub-card expands', () => {
    cy.visit('/resources/resource-1')
    cy.wait('@getResource')

    cy.get('[data-automation-id="resource-view-notes-card-collapse-button"]').click()
    cy.wait('@getAggregation')
    cy.get('[data-automation-id="resource-view-notes-list"]').should('be.visible')
    cy.get('[data-automation-id="resource-view-note-0-text-display"]')
      .should('contain.text', 'Helpful resource for learning async patterns.')
  })
})
