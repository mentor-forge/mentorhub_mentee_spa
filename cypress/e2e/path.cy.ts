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
    cy.intercept('GET', '**/api/path/path-1', {
      ...firstPath,
    }).as('getPath')
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
