describe('Path Domain', () => {
  // Browser URL carries the `/mentee/` journey prefix; the Vue route stays `/paths/:id`.
  const PATH_DETAIL_URL = '/mentee/paths/path-1'

  const firstPath = {
    _id: 'path-1',
    name: 'First Path',
    description: 'First description',
    status: 'active',
  }

  const pathDetailBody = {
    ...firstPath,
    technologies: ['Python', 'TypeScript'],
    interests: ['api', 'data'],
    modules: [
      {
        name: 'Module One',
        description: 'First module description',
        topics: [
          {
            name: 'Topic Alpha',
            description: 'First topic description',
            resources: [
              {
                _id: 'resource-1',
                name: 'First Resource',
                description: 'Embedded resource summary',
              },
            ],
          },
        ],
      },
    ],
    created: {
      from_ip: '127.0.0.1',
      by_user: 'admin-user',
      at_time: '2024-01-01T00:00:00Z',
      correlation_id: 'path-created',
    },
    saved: {
      from_ip: '127.0.0.1',
      by_user: 'admin-user',
      at_time: '2024-01-02T00:00:00Z',
      correlation_id: 'path-saved',
    },
  }

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
    cy.intercept('GET', '**/mentee/api/path/path-1', pathDetailBody).as('getPath')
    cy.intercept('GET', '**/mentee/api/resource/resource-1', resourceDetailBody).as('getResource')
  })

  it('should expand nested module, topic, and resource cards', () => {
    cy.visitPrefixed(PATH_DETAIL_URL)
    cy.wait('@getPath')
    cy.location('pathname').should('eq', PATH_DETAIL_URL)

    cy.get('[data-automation-id="path-view-modules-card-collapse-button"]').click()
    cy.get('[data-automation-id="path-view-module-0-card-collapse-button"]').click()
    cy.get('[data-automation-id="path-view-module-0-description-display"]').should('be.visible')
    cy.get('[data-automation-id="path-view-module-0-topic-0-card"]').should('have.class', 'mh-card--collapsed')

    cy.get('[data-automation-id="path-view-module-0-topic-0-card-collapse-button"]').click()
    cy.get('[data-automation-id="path-view-module-0-topic-0-description-display"]').should('be.visible')
    cy.get('[data-automation-id="path-view-module-0-topic-0-resource-0-card"]').should(
      'have.class',
      'mh-card--collapsed'
    )

    cy.get('[data-automation-id="path-view-module-0-topic-0-resource-0-card-collapse-button"]').click()
    cy.wait('@getResource')
    cy.get('[data-automation-id="path-view-module-0-topic-0-resource-0-url-display"]').should('be.visible')
    cy.get('[data-automation-id="path-view-module-0-topic-0-resource-0-aggregation-heading"]').should(
      'be.visible'
    )
    cy.get('[data-automation-id="path-view-module-0-topic-0-resource-0-notes-heading"]').should(
      'be.visible'
    )
    cy.get('[data-automation-id="path-view-module-0-topic-0-resource-0-aggregation-hits-display"]').should(
      'be.visible'
    )
    cy.get('[data-automation-id="path-view-module-0-topic-0-resource-0-notes-list"]').should(
      'be.visible'
    )
  })

  it('should show administration fields only in the collapsed admin sub-card', () => {
    cy.visitPrefixed(PATH_DETAIL_URL)
    cy.wait('@getPath')

    cy.get('[data-automation-id="path-view-admin-card"]').should('be.visible')
    cy.get('[data-automation-id="path-view-admin-card"]').should('have.class', 'mh-card--collapsed')
    cy.get('[data-automation-id="path-view-status-display"]').should('not.be.visible')

    cy.get('[data-automation-id="path-view-admin-card-collapse-button"]').click()
    cy.get('[data-automation-id="path-view-status-display"]').should('be.visible')
    cy.get('[data-automation-id="path-view-created-from-ip-display"]').should('be.visible')
    cy.get('[data-automation-id="path-view-saved-from-ip-display"]').should('be.visible')
  })

  it('should hide administration card from non-admin users', () => {
    cy.login(['mentee'])
    cy.visitPrefixed(PATH_DETAIL_URL)
    cy.wait('@getPath')

    cy.get('[data-automation-id="path-view-admin-card"]').should('not.exist')
    cy.get('[data-automation-id="path-view-status-display"]').should('not.exist')
  })

  it('should link Browse Paths to Discovery on the welcome origin', () => {
    cy.visitPrefixed(PATH_DETAIL_URL)
    cy.wait('@getPath')

    cy.get('[data-automation-id="path-view-browse-paths-link"]')
      .should('have.attr', 'href', 'http://localhost:8080/discovery/paths')
  })
})
