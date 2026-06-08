describe('Journey Domain', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should display journeys list page', () => {
    cy.visit('/journeys')
    cy.get('h1').contains('Journeys').should('be.visible')
    cy.get('[data-automation-id="journey-list-new-button"]').should('be.visible')
  })

  it('should navigate to new journey page', () => {
    cy.visit('/journeys')
    cy.get('[data-automation-id="journey-list-new-button"]').click()
    cy.url().should('include', '/journeys/new')
    cy.get('h1').contains('New Journey').should('be.visible')
  })

  it('should create a new journey', () => {
    cy.visit('/journeys/new')
    
    const timestamp = Date.now()
    const itemName = `test-journey-${timestamp}`
    
    // Use automation IDs for reliable element selection
    cy.get('[data-automation-id="journey-new-name-input"]').type(itemName)
    cy.get('[data-automation-id="journey-new-description-input"]').type('Test description for Cypress')
    cy.get('[data-automation-id="journey-new-submit-button"]').click()
    
    // Should redirect to edit page after creation
    cy.url().should('include', '/journeys/')
    cy.url().should('not.include', '/journeys/new')
    
    // Verify the journey name is displayed on edit page
    cy.get('[data-automation-id="journey-edit-name-input"]').find('input').should('have.value', itemName)
  })

  it('should update a journey', () => {
    // First create a journey
    cy.visit('/journeys/new')
    const timestamp = Date.now()
    const itemName = `test-journey-update-${timestamp}`
    const updatedName = `updated-journey-${timestamp}`
    
    cy.get('[data-automation-id="journey-new-name-input"]').type(itemName)
    cy.get('[data-automation-id="journey-new-description-input"]').type('Original description')
    cy.get('[data-automation-id="journey-new-submit-button"]').click()
    
    // Wait for redirect to edit page
    cy.url().should('include', '/journeys/')
    
    // Update the name field (auto-save on blur)
    cy.get('[data-automation-id="journey-edit-name-input"]').find('input').clear().type(updatedName)
    cy.get('[data-automation-id="journey-edit-name-input"]').find('input').blur()
    
    // Wait for save to complete
    cy.wait(1000)
    
    // Verify the update was saved
    cy.get('[data-automation-id="journey-edit-name-input"]').find('input').should('have.value', updatedName)
    
    // Update description
    cy.get('[data-automation-id="journey-edit-description-input"]').find('textarea').clear().type('Updated description')
    cy.get('[data-automation-id="journey-edit-description-input"]').find('textarea').blur()
    cy.wait(1000)
    
    // Update status
    cy.get('[data-automation-id="journey-edit-status-select"]').click()
    cy.get('.v-list-item').contains('archived').click()
    cy.wait(1000)
    
    // Navigate back to list and verify the journey appears with updated name
    cy.get('[data-automation-id="journey-edit-back-button"]').click()
    cy.url().should('include', '/journeys')
    
    // Search for the updated journey
    cy.get('[data-automation-id="journey-list-search"]').find('input').type(updatedName)
    // Wait for debounce (300ms) plus API call
    cy.wait(800)
    
    // Verify the journey appears in the search results
    cy.get('table').should('contain', updatedName)
    
    // Clear search and verify all journeys are shown again
    cy.get('[data-automation-id="journey-list-search"]').find('input').clear()
    cy.wait(800)
    cy.get('table').should('exist')
  })

  it('should search for journeys', () => {
    // First create a journey with a unique name
    cy.visit('/journeys/new')
    const timestamp = Date.now()
    const itemName = `search-test-${timestamp}`
    
    cy.get('[data-automation-id="journey-new-name-input"]').type(itemName)
    cy.get('[data-automation-id="journey-new-description-input"]').type('Search test description')
    cy.get('[data-automation-id="journey-new-submit-button"]').click()
    cy.url().should('include', '/journeys/')
    
    // Navigate to list page
    cy.visit('/journeys')
    
    // Wait for initial load
    cy.get('table').should('exist')
    
    // Search for the journey
    cy.get('[data-automation-id="journey-list-search"]').find('input').type(itemName)
    // Wait for debounce (300ms) plus API call
    cy.wait(800)
    
    // Verify the search results contain the journey
    cy.get('table tbody').should('contain', itemName)
    
    // Clear search and verify all journeys are shown again
    cy.get('[data-automation-id="journey-list-search"]').find('input').clear()
    cy.wait(800)
    cy.get('table').should('exist')
  })
})
