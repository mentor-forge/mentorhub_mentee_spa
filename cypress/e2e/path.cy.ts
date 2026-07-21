describe('Path Domain', () => {
  const gridSelector = '[data-automation-id="path-list-grid"]'
  const firstCardSelector = '[data-automation-id="path-list-path-path-1-card"]'
  const secondCardSelector = '[data-automation-id="path-list-path-path-2-card"]'
  const shortCardSelector = '[data-automation-id="path-list-path-path-short-card"]'
  const longCardSelector = '[data-automation-id="path-list-path-path-long-card"]'

  const shortPath = {
    _id: 'path-short',
    name: 'Short',
    description: 'Brief.',
    status: 'active',
  }
  const longPath = {
    _id: 'path-long',
    name: 'Very Long Path Name For Equal Height Layout',
    description:
      'This is a substantially longer description used to verify that cards in the same visual row stretch to equal rendered heights while keeping equal column widths across the responsive grid.',
    status: 'active',
  }
  const firstPath = {
    _id: 'path-1',
    name: 'First Path',
    description: 'First description',
    status: 'active',
  }
  const secondPath = {
    _id: 'path-2',
    name: 'Second Path',
    description: 'Second description',
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

  /** Count visual CSS Grid tracks from the first row of grid items. */
  function countGridColumns($grid: JQuery<HTMLElement>): number {
    const items = $grid.children('.mh-card-grid__item').toArray()
    if (items.length === 0) return 0

    const firstRowTop = items[0].getBoundingClientRect().top
    return items.filter((item) => Math.abs(item.getBoundingClientRect().top - firstRowTop) < 2).length
  }

  beforeEach(() => {
    cy.login()
    cy.intercept('GET', '**/api/path*', (request) => {
      if (request.url.match(/\/api\/path\/[^/?]+$/)) {
        request.reply(pathDetailBody)
        return
      }

      const isNextPage = request.headers.offset === '20'
      const firstPage = [
        firstPath,
        shortPath,
        longPath,
        ...Array.from({ length: 17 }, (_, index) => ({
          _id: `path-filler-${index}`,
          name: `Path ${index + 4}`,
          description: index % 2 === 0 ? 'Short filler.' : 'A moderately longer filler description for row height variety.',
          status: 'active',
        })),
      ]
      request.reply(isNextPage ? [secondPath] : firstPage)
    }).as('getPaths')
    cy.intercept('GET', '**/api/path/path-1', pathDetailBody).as('getPath')
    cy.intercept('GET', '**/api/resource/resource-1', resourceDetailBody).as('getResource')
  })

  it('should display paths list page', () => {
    cy.visit('/paths')
    cy.get('[data-automation-id="path-list-heading"]').should('be.visible')
    cy.get(gridSelector).should('exist')
    cy.get(firstCardSelector).should('be.visible')
  })

  it('should render path name as the full card header and description only in the body', () => {
    cy.visit('/paths')
    cy.get(firstCardSelector).should('be.visible')

    cy.get('[data-automation-id="path-list-path-path-1-card-title-display"]')
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        expect(text.trim()).to.equal(firstPath.name)
        expect(text).to.not.match(/^Path\s/)
      })

    cy.get('[data-automation-id="path-list-path-path-1-card-title-display"] .mh-card__name').should(
      'not.exist'
    )

    cy.get('[data-automation-id="path-list-path-path-1-description-display"]')
      .should('be.visible')
      .and('contain.text', firstPath.description)

    cy.get('[data-automation-id="path-list-path-path-1-status-display"]').should('not.exist')
    cy.get(`${firstCardSelector} .v-chip`).should('not.exist')
  })

  it('should keep equal card widths and equal heights within a row despite varied descriptions', () => {
    cy.viewport(1280, 900)
    cy.visit('/paths')
    cy.get(shortCardSelector).should('be.visible')
    cy.get(longCardSelector).should('be.visible')

    cy.get(gridSelector).then(($grid) => {
      const columns = countGridColumns($grid)
      expect(columns).to.be.at.least(2)

      const items = $grid.children('.mh-card-grid__item').toArray()
      const firstRowTop = items[0].getBoundingClientRect().top
      const firstRow = items.filter(
        (item) => Math.abs(item.getBoundingClientRect().top - firstRowTop) < 2
      )
      expect(firstRow.length).to.equal(columns)

      const widths = firstRow.map((item) => item.getBoundingClientRect().width)
      const heights = firstRow.map((item) => {
        const card = item.querySelector('.mh-card') as HTMLElement
        return card.getBoundingClientRect().height
      })

      const widthTolerance = 1
      const heightTolerance = 1
      widths.forEach((width) => {
        expect(Math.abs(width - widths[0])).to.be.at.most(widthTolerance)
      })
      heights.forEach((height) => {
        expect(Math.abs(height - heights[0])).to.be.at.most(heightTolerance)
      })
      expect(heights[0]).to.be.greaterThan(0)
    })
  })

  it('should progress responsive column counts beyond four up to eight at 2560px', () => {
    const cases: Array<{ width: number; expectedColumns: number }> = [
      { width: 500, expectedColumns: 1 },
      { width: 700, expectedColumns: 2 },
      { width: 1000, expectedColumns: 3 },
      { width: 1400, expectedColumns: 4 },
      { width: 1700, expectedColumns: 5 },
      { width: 2000, expectedColumns: 6 },
      { width: 2300, expectedColumns: 7 },
      { width: 2560, expectedColumns: 8 },
      { width: 2800, expectedColumns: 8 },
    ]

    cy.visit('/paths')
    cy.get(gridSelector).should('exist')

    cases.forEach(({ width, expectedColumns }) => {
      cy.viewport(width, 900)
      cy.get(gridSelector).should(($grid) => {
        expect(countGridColumns($grid)).to.equal(expectedColumns)
      })
    })
  })

  it('should load more path cards through the shared control', () => {
    cy.visit('/paths')

    cy.get('[data-automation-id="path-list-load-more"]').should('be.visible').click()
    cy.wait('@getPaths')
    cy.get(secondCardSelector).should('be.visible')
  })

  it('should display a read-only path detail with nested collapsed cards', () => {
    cy.visit('/paths')

    cy.get('[data-automation-id="path-list-path-path-1-view-button"]').click()
    cy.wait('@getPath')
    cy.get('[data-automation-id="path-view-heading"]').should('be.visible')
    cy.get('[data-automation-id="path-view-card"]').should('be.visible')
    cy.get('[data-automation-id="path-view-card-collapse-button"]').should('not.exist')
    cy.get('[data-automation-id="path-view-card-title-display"]').should('contain.text', 'First Path')
    cy.get('[data-automation-id="path-view-description-display"]').should('be.visible')
    cy.get('[data-automation-id="path-view-technologies-display"]').should('be.visible')
    cy.get('[data-automation-id="path-view-interests-display"]').should('be.visible')
    cy.get('[data-automation-id="path-view-status-display"]').should('not.be.visible')
    cy.get('[data-automation-id="path-view-back-to-list-button"]').should('be.visible')
    cy.get('[data-automation-id="path-view-modules-card"]').should('be.visible')
    cy.get('[data-automation-id="path-view-modules-card"]').should('have.class', 'mh-card--collapsed')
    cy.get('[data-automation-id="path-view-module-0-card"]').should('have.class', 'mh-card--collapsed')
    cy.get('[data-automation-id="path-view-module-0-description-display"]').should('not.be.visible')
    cy.get('[data-automation-id="path-view-module-0-topic-0-resource-0-admin-card"]').should('not.exist')
    cy.get('button[data-automation-id*="add"]').should('not.exist')
    cy.get('button[data-automation-id*="delete"]').should('not.exist')
    cy.get('[data-automation-id*="drag"]').should('not.exist')
  })

  it('should expand nested module, topic, and resource cards', () => {
    cy.visit('/paths/path-1')
    cy.wait('@getPath')

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
    cy.visit('/paths/path-1')
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
    cy.visit('/paths/path-1')
    cy.wait('@getPath')

    cy.get('[data-automation-id="path-view-admin-card"]').should('not.exist')
    cy.get('[data-automation-id="path-view-status-display"]').should('not.exist')
  })
})
