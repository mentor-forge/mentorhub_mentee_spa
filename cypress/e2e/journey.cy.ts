describe('Journey Page', () => {
  const journeyId = '507f1f77bcf86cd799439011'

  const journeyBody = {
    _id: journeyId,
    profile_id: journeyId,
    profile: {
      _id: journeyId,
      full_name: 'Jane Mentee',
      email: 'jane@example.com',
      goals: ['Learn Python', 'Build a portfolio'],
      interests: ['api'],
      description: 'Working toward first internship.',
      status: 'active',
    },
    status: 'active',
    later: ['path-later-1'],
    next: [
      {
        name: 'NextModule',
        description: 'Next module description',
        topics: [
          {
            name: 'TopicOne',
            description: 'Next topic description',
            resources: ['resource-next-1'],
          },
        ],
      },
    ],
    now: [
      {
        resource_id: 'resource-now-1',
        added: '2024-01-01T00:00:00Z',
        used: 0,
      },
    ],
    library: [
      {
        resource_id: 'resource-lib-1',
        completed: '2024-01-02T00:00:00Z',
        rating: 3,
        used: 1,
      },
    ],
    created: {
      from_ip: '127.0.0.1',
      by_user: 'user1',
      at_time: '2024-01-01T00:00:00Z',
      correlation_id: 'journey-created',
    },
    saved: {
      from_ip: '127.0.0.1',
      by_user: 'user1',
      at_time: '2024-01-02T00:00:00Z',
      correlation_id: 'journey-saved',
    },
  }

  const pathDetailBody = {
    _id: 'path-later-1',
    name: 'Later Path',
    description: 'A path queued for later',
    technologies: ['Python'],
    interests: ['api'],
    modules: [
      {
        name: 'Foundations',
        description: 'Foundation module',
        topics: [
          {
            name: 'Basics',
            description: 'Basic topic',
            resources: [
              {
                _id: 'resource-later-1',
                name: 'Later Resource',
                description: 'Resource in later path',
              },
            ],
          },
        ],
      },
      {
        name: 'Advanced',
        description: 'Advanced module',
        topics: [],
      },
    ],
    status: 'active',
  }

  const resourceDetailBody = {
    resource: {
      _id: 'resource-next-1',
      name: 'Next Resource',
      description: 'Resource in next scope',
      status: 'active',
      url: 'https://example.com/next',
      type: 'article',
      cost: 'free',
      skill_level: 'Apprentice',
      interests: ['api'],
      technologies: ['Python'],
      last_verified: '2024-01-01T00:00:00Z',
    },
    aggregation: {
      _id: 'agg-1',
      resource_id: 'resource-next-1',
      note_count: 0,
      completions: 1,
      hits: 2,
      duration: 'PT1H',
      rating_count: 1,
      rating_sum: 4,
      created: journeyBody.created,
      last_saved: journeyBody.saved,
    },
    notes: [],
  }

  const nowResourceDetailBody = {
    ...resourceDetailBody,
    resource: {
      ...resourceDetailBody.resource,
      _id: 'resource-now-1',
      name: 'Now Resource',
    },
  }

  function stubJourney(body = journeyBody) {
    cy.intercept('GET', '**/api/journey', body).as('getJourney')
  }

  beforeEach(() => {
    cy.login()
  })

  it('should land on journey page from default route', () => {
    cy.visit('/')
    cy.url().should('include', '/journey')
    cy.get('[data-automation-id="journey-detail-card"]').should('be.visible')
  })

  it('should load journey detail sections from API', () => {
    stubJourney()
    cy.visit('/journey')
    cy.wait('@getJourney')

    cy.get('[data-automation-id="journey-profile-full-name-display"]').should('contain', 'Jane Mentee')
    cy.get('[data-automation-id="journey-profile-email-display"]').should('contain', 'jane@example.com')
    cy.get('[data-automation-id="journey-profile-goal-0-display"]').should('contain', 'Learn Python')
    cy.get('[data-automation-id="journey-profile-interests-display"]').should('be.visible')
    cy.get('[data-automation-id="journey-profile-notes-display"]').should('contain', 'Working toward first internship.')
    cy.get('[data-automation-id="app-bar-title"]').should('contain', 'Jane Mentee:Mentee')
    cy.get('[data-automation-id="journey-detail-card"]').should('be.visible')
    cy.get('[data-automation-id="journey-detail-card-collapse-button"]').should('not.exist')
    cy.get('[data-automation-id="journey-edit-status-select"]').should('not.be.visible')

    const sectionCardIds = [
      'journey-detail-now-card',
      'journey-detail-next-card',
      'journey-detail-later-card',
      'journey-detail-library-card',
      'journey-detail-admin-card',
    ]
    cy.get(sectionCardIds.map((id) => `[data-automation-id="${id}"]`).join(',')).then(($cards) => {
      const order = [...$cards].map((el) => el.getAttribute('data-automation-id'))
      expect(order).to.deep.equal(sectionCardIds)
    })
  })

  it('should navigate to journey from drawer', () => {
    cy.visit('/paths')
    cy.get('[data-automation-id="nav-drawer-toggle"]').click()
    cy.get('[data-automation-id="nav-journey-link"]').click()
    cy.url().should('include', '/journey')
    cy.get('[data-automation-id="journey-detail-card"]').should('be.visible')
  })

  it('should update journey status from runtime enum values via auto-save', () => {
    stubJourney()
    cy.intercept('PATCH', `**/api/journey/${journeyId}`, (request) => {
      request.reply({
        statusCode: 200,
        body: {
          ...journeyBody,
          status: request.body.status,
        },
      })
    }).as('updateJourney')
    cy.visit('/journey')
    cy.wait('@getJourney')

    cy.get('[data-automation-id="journey-detail-admin-card-collapse-button"]').click()
    cy.get('[data-automation-id="journey-edit-status-select"]').then(($select) => {
      const isActive = $select.text().includes('Not Deleted')
      const optionLabel = isActive ? 'Soft Delete Indicator' : 'Not Deleted'
      const optionValue = isActive ? 'archived' : 'active'

      cy.wrap($select).click()
      cy.contains('[role="option"]', optionLabel).click()
      cy.get('[data-automation-id="journey-edit-status-select"]').find('input').focus().blur()

      cy.wait('@updateJourney').its('request.body').should('deep.equal', { status: optionValue })
      cy.get('[data-automation-id="journey-edit-status-select"]').should('contain', optionLabel)
    })
  })

  it('should expand journey sections and lazy-load later path detail', () => {
    stubJourney()
    cy.intercept('GET', '**/api/path/path-later-1', pathDetailBody).as('getLaterPath')
    cy.visit('/journey')
    cy.wait('@getJourney')
    cy.wait('@getLaterPath')

    cy.get('[data-automation-id="journey-detail-later-card-collapse-button"]').click()
    cy.get('[data-automation-id="journey-detail-later-path-0-card-title-display"]').should(
      'contain',
      'Path:Later Path'
    )
    cy.get('[data-automation-id="journey-detail-later-path-0-card-collapse-button"]').click()
    cy.get('[data-automation-id="journey-detail-later-path-0-description-display"]').should('be.visible')
    cy.get('[data-automation-id="journey-later-0-promote-path-button"]').should('be.visible')
    cy.get('button[data-automation-id*="add"]').should('not.exist')
    cy.get('button[data-automation-id*="delete"]').should('not.exist')
  })

  it('should expand next resource embed and show aggregation from resource detail', () => {
    stubJourney()
    cy.intercept('GET', '**/api/resource/resource-next-1', resourceDetailBody).as('getResource')
    cy.visit('/journey')
    cy.wait('@getJourney')

    cy.get('[data-automation-id="journey-detail-next-card-collapse-button"]').click()
    cy.get('[data-automation-id="journey-detail-next-module-0-card-collapse-button"]').click()
    cy.get('[data-automation-id="journey-detail-next-module-0-topic-0-card-collapse-button"]').click()
    cy.get('[data-automation-id="journey-detail-next-module-0-topic-0-resource-0-card-collapse-button"]').click()
    cy.wait('@getResource')
    cy.get('[data-automation-id="journey-detail-next-module-0-topic-0-resource-0-url-display"]').should('be.visible')
    cy.get(
      '[data-automation-id="journey-detail-next-module-0-topic-0-resource-0-advance-button"]'
    ).should('be.visible')
    cy.get(
      '[data-automation-id="journey-detail-next-module-0-topic-0-resource-0-aggregation-hits-display"]'
    ).should('be.visible')
  })

  it('should promote a path from later to next', () => {
    stubJourney()
    cy.intercept('PATCH', '**/api/journey/promote/path/path-later-1', {
      statusCode: 200,
      body: {
        ...journeyBody,
        later: [],
        next: [...journeyBody.next, ...pathDetailBody.modules.map((module) => ({
          name: module.name,
          description: module.description,
          topics: module.topics,
        }))],
      },
    }).as('promotePath')
    cy.visit('/journey')
    cy.wait('@getJourney')

    cy.get('[data-automation-id="journey-detail-later-card-collapse-button"]').click()
    cy.get('[data-automation-id="journey-later-0-promote-path-button"]').click()
    cy.wait('@promotePath')
  })

  it('should promote a module from a later path to next', () => {
    stubJourney()
    cy.intercept('GET', '**/api/path/path-later-1', pathDetailBody).as('getLaterPath')
    cy.intercept('PATCH', '**/api/journey/promote/module/path-later-1/Foundations', {
      statusCode: 200,
      body: {
        ...journeyBody,
        next: [
          ...journeyBody.next,
          {
            name: 'Foundations',
            description: 'Foundation module',
            topics: pathDetailBody.modules[0].topics,
          },
        ],
      },
    }).as('promoteModule')
    cy.visit('/journey')
    cy.wait('@getJourney')
    cy.wait('@getLaterPath')

    cy.get('[data-automation-id="journey-detail-later-card-collapse-button"]').click()
    cy.get('[data-automation-id="journey-detail-later-path-0-card-collapse-button"]').click()
    cy.get('[data-automation-id="journey-detail-later-path-0-modules-card-collapse-button"]').click()
    cy.get('[data-automation-id="journey-detail-later-path-0-module-0-card-collapse-button"]').click()
    cy.get('[data-automation-id="journey-later-0-module-0-promote-button"]').click()
    cy.wait('@promoteModule')
  })

  it('should advance a resource from next to now', () => {
    stubJourney()
    cy.intercept('GET', '**/api/resource/resource-next-1', resourceDetailBody).as('getResource')
    cy.intercept('PATCH', '**/api/journey/advance/resource-next-1', {
      statusCode: 200,
      body: {
        ...journeyBody,
        next: [],
        now: [
          ...journeyBody.now,
          {
            resource_id: 'resource-next-1',
            added: '2024-01-03T00:00:00Z',
            used: 0,
          },
        ],
      },
    }).as('advanceResource')
    cy.visit('/journey')
    cy.wait('@getJourney')

    cy.get('[data-automation-id="journey-detail-next-card-collapse-button"]').click()
    cy.get('[data-automation-id="journey-detail-next-module-0-card-collapse-button"]').click()
    cy.get('[data-automation-id="journey-detail-next-module-0-topic-0-card-collapse-button"]').click()
    cy.wait('@getResource')
    cy.get(
      '[data-automation-id="journey-detail-next-module-0-topic-0-resource-0-advance-button"]'
    ).click()
    cy.wait('@advanceResource')
  })

  it('should complete a resource in now with rating and note', () => {
    stubJourney()
    cy.intercept('GET', '**/api/resource/resource-now-1', nowResourceDetailBody).as('getNowResource')
    cy.intercept('PATCH', '**/api/journey/complete/resource-now-1', (request) => {
      expect(request.body).to.deep.include({ rating: 4, note: 'Finished reading' })
      request.reply({
        statusCode: 200,
        body: {
          ...journeyBody,
          now: [],
          library: [
            ...journeyBody.library,
            {
              resource_id: 'resource-now-1',
              completed: '2024-01-03T00:00:00Z',
              rating: 4,
              used: 0,
            },
          ],
        },
      })
    }).as('completeResource')
    cy.visit('/journey')
    cy.wait('@getJourney')

    cy.get('[data-automation-id="journey-detail-now-card-collapse-button"]').click()
    cy.get('[data-automation-id="journey-now-0-done-button"]').click()
    cy.get('[data-automation-id="journey-complete-dialog"]').should('be.visible')
    cy.get('[data-automation-id="journey-complete-rating"] button').last().click()
    cy.get('[data-automation-id="journey-complete-note"]').type('Finished reading')
    cy.get('[data-automation-id="journey-complete-confirm"]').click()
    cy.wait('@completeResource')
    cy.get('[data-automation-id="journey-complete-dialog"]').should('not.exist')
  })
})
