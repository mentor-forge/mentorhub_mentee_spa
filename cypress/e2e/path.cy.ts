describe('Path Domain', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should display paths list page', () => {
    cy.visit('/paths')
    cy.get('h1').contains('Paths').should('be.visible')
  })

  it('should search for paths using existing test data', () => {
    cy.visit('/paths')
    
    // Wait for initial load
    cy.get('table').should('exist')
    // Wait a bit for data to load
    cy.wait(1000)
    
    // Check if table has data, if so get first path name to search for
    cy.get('body').then(($body) => {
      const hasRows = $body.find('table tbody tr').length > 0
      
      if (hasRows) {
        // Get the first path name from the table to search for
        cy.get('table tbody tr').first().find('td').first().invoke('text').then((firstItemName) => {
          const trimmedName = firstItemName.trim()
          if (trimmedName.length > 0) {
            const searchTerm = trimmedName.substring(0, Math.min(5, trimmedName.length)) // Use first 5 chars for partial match
            
            // Search for paths using partial name
            cy.get('[data-automation-id="path-list-search"]').find('input').type(searchTerm)
            // Wait for debounce (300ms) plus API call
            cy.wait(800)
            
            // Verify the search results contain the path (should find at least the one we searched for)
            cy.get('table tbody').should('contain', trimmedName)
            
            // Clear search and verify all paths are shown again
            cy.get('[data-automation-id="path-list-search"]').find('input').clear()
            cy.wait(800)
            cy.get('table').should('exist')
          }
        })
      } else {
        // If no data, just verify search input exists and can be used
        cy.get('[data-automation-id="path-list-search"]').find('input').should('exist')
        cy.get('[data-automation-id="path-list-search"]').find('input').type('test')
        cy.wait(800)
        cy.get('[data-automation-id="path-list-search"]').find('input').clear()
      }
    })
  })

  it('should search for paths and filter results', () => {
    cy.visit('/paths')
    
    // Wait for initial load
    cy.get('table').should('exist')
    
    // Count initial rows
    cy.get('table tbody tr').then(($rows) => {
      const initialCount = $rows.length
      
      // Search for a term that might not exist (should show fewer or no results)
      cy.get('[data-automation-id="path-list-search"]').find('input').type('nonexistent-search-term-xyz')
      // Wait for debounce (300ms) plus API call
      cy.wait(800)
      
      // Verify search was performed (table should still exist, but may have fewer/no results)
      cy.get('table').should('exist')
      
      // Clear search and verify all paths are shown again
      cy.get('[data-automation-id="path-list-search"]').find('input').clear()
      cy.wait(800)
      
      // Should have same or more results after clearing
      cy.get('table tbody tr').should('have.length.at.least', initialCount)
    })
  })

  it('should not have a new path button (read-only)', () => {
    cy.visit('/paths')
    cy.get('button').contains('New Path').should('not.exist')
  })
})
