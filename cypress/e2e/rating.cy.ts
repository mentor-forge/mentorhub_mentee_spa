describe('Rating Domain', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should display ratings list page', () => {
    cy.visit('/ratings')
    cy.get('h1').contains('Ratings').should('be.visible')
    cy.get('[data-automation-id="rating-list-new-button"]').should('be.visible')
  })

  it('should navigate to new rating page', () => {
    cy.visit('/ratings')
    cy.get('[data-automation-id="rating-list-new-button"]').click()
    cy.url().should('include', '/ratings/new')
    cy.get('h1').contains('New Rating').should('be.visible')
  })

  it('should create a new rating', () => {
    cy.visit('/ratings/new')
    
    const timestamp = Date.now()
    const itemName = `test-rating-${timestamp}`
    
    // Use automation IDs for reliable element selection
    cy.get('[data-automation-id="rating-new-name-input"]').type(itemName)
    cy.get('[data-automation-id="rating-new-description-input"]').type('Test description for Cypress')
    cy.get('[data-automation-id="rating-new-submit-button"]').click()
    
    // Should redirect to edit page after creation
    cy.url().should('include', '/ratings/')
    cy.url().should('not.include', '/ratings/new')
    
    // Verify the rating name is displayed on edit page
    cy.get('[data-automation-id="rating-edit-name-input"]').find('input').should('have.value', itemName)
  })

  it('should update a rating', () => {
    // First create a rating
    cy.visit('/ratings/new')
    const timestamp = Date.now()
    const itemName = `test-rating-update-${timestamp}`
    const updatedName = `updated-rating-${timestamp}`
    
    cy.get('[data-automation-id="rating-new-name-input"]').type(itemName)
    cy.get('[data-automation-id="rating-new-description-input"]').type('Original description')
    cy.get('[data-automation-id="rating-new-submit-button"]').click()
    
    // Wait for redirect to edit page
    cy.url().should('include', '/ratings/')
    
    // Update the name field (auto-save on blur)
    cy.get('[data-automation-id="rating-edit-name-input"]').find('input').clear().type(updatedName)
    cy.get('[data-automation-id="rating-edit-name-input"]').find('input').blur()
    
    // Wait for save to complete
    cy.wait(1000)
    
    // Verify the update was saved
    cy.get('[data-automation-id="rating-edit-name-input"]').find('input').should('have.value', updatedName)
    
    // Update description
    cy.get('[data-automation-id="rating-edit-description-input"]').find('textarea').clear().type('Updated description')
    cy.get('[data-automation-id="rating-edit-description-input"]').find('textarea').blur()
    cy.wait(1000)
    
    // Update status
    cy.get('[data-automation-id="rating-edit-status-select"]').click()
    cy.get('.v-list-item').contains('archived').click()
    cy.wait(1000)
    
    // Navigate back to list and verify the rating appears with updated name
    cy.get('[data-automation-id="rating-edit-back-button"]').click()
    cy.url().should('include', '/ratings')
    
    // Search for the updated rating
    cy.get('[data-automation-id="rating-list-search"]').find('input').type(updatedName)
    // Wait for debounce (300ms) plus API call
    cy.wait(800)
    
    // Verify the rating appears in the search results
    cy.get('table').should('contain', updatedName)
    
    // Clear search and verify all ratings are shown again
    cy.get('[data-automation-id="rating-list-search"]').find('input').clear()
    cy.wait(800)
    cy.get('table').should('exist')
  })

  it('should search for ratings', () => {
    // First create a rating with a unique name
    cy.visit('/ratings/new')
    const timestamp = Date.now()
    const itemName = `search-test-${timestamp}`
    
    cy.get('[data-automation-id="rating-new-name-input"]').type(itemName)
    cy.get('[data-automation-id="rating-new-description-input"]').type('Search test description')
    cy.get('[data-automation-id="rating-new-submit-button"]').click()
    cy.url().should('include', '/ratings/')
    
    // Navigate to list page
    cy.visit('/ratings')
    
    // Wait for initial load
    cy.get('table').should('exist')
    
    // Search for the rating
    cy.get('[data-automation-id="rating-list-search"]').find('input').type(itemName)
    // Wait for debounce (300ms) plus API call
    cy.wait(800)
    
    // Verify the search results contain the rating
    cy.get('table tbody').should('contain', itemName)
    
    // Clear search and verify all ratings are shown again
    cy.get('[data-automation-id="rating-list-search"]').find('input').clear()
    cy.wait(800)
    cy.get('table').should('exist')
  })
})
