describe('Note Domain', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should display notes list page', () => {
    cy.visit('/notes')
    cy.get('h1').contains('Notes').should('be.visible')
    cy.get('[data-automation-id="note-list-new-button"]').should('be.visible')
  })

  it('should navigate to new note page', () => {
    cy.visit('/notes')
    cy.get('[data-automation-id="note-list-new-button"]').click()
    cy.url().should('include', '/notes/new')
    cy.get('h1').contains('New Note').should('be.visible')
  })

  it('should create a new note', () => {
    cy.visit('/notes/new')
    
    const timestamp = Date.now()
    const itemName = `test-note-${timestamp}`
    
    // Use automation IDs for reliable element selection
    cy.get('[data-automation-id="note-new-name-input"]').type(itemName)
    cy.get('[data-automation-id="note-new-description-input"]').type('Test description for Cypress')
    cy.get('[data-automation-id="note-new-submit-button"]').click()
    
    // Should redirect to edit page after creation
    cy.url().should('include', '/notes/')
    cy.url().should('not.include', '/notes/new')
    
    // Verify the note name is displayed on edit page
    cy.get('[data-automation-id="note-edit-name-input"]').find('input').should('have.value', itemName)
  })

  it('should update a note', () => {
    // First create a note
    cy.visit('/notes/new')
    const timestamp = Date.now()
    const itemName = `test-note-update-${timestamp}`
    const updatedName = `updated-note-${timestamp}`
    
    cy.get('[data-automation-id="note-new-name-input"]').type(itemName)
    cy.get('[data-automation-id="note-new-description-input"]').type('Original description')
    cy.get('[data-automation-id="note-new-submit-button"]').click()
    
    // Wait for redirect to edit page
    cy.url().should('include', '/notes/')
    
    // Update the name field (auto-save on blur)
    cy.get('[data-automation-id="note-edit-name-input"]').find('input').clear().type(updatedName)
    cy.get('[data-automation-id="note-edit-name-input"]').find('input').blur()
    
    // Wait for save to complete
    cy.wait(1000)
    
    // Verify the update was saved
    cy.get('[data-automation-id="note-edit-name-input"]').find('input').should('have.value', updatedName)
    
    // Update description
    cy.get('[data-automation-id="note-edit-description-input"]').find('textarea').clear().type('Updated description')
    cy.get('[data-automation-id="note-edit-description-input"]').find('textarea').blur()
    cy.wait(1000)
    
    // Update status
    cy.get('[data-automation-id="note-edit-status-select"]').click()
    cy.get('.v-list-item').contains('archived').click()
    cy.wait(1000)
    
    // Navigate back to list and verify the note appears with updated name
    cy.get('[data-automation-id="note-edit-back-button"]').click()
    cy.url().should('include', '/notes')
    
    // Search for the updated note
    cy.get('[data-automation-id="note-list-search"]').find('input').type(updatedName)
    // Wait for debounce (300ms) plus API call
    cy.wait(800)
    
    // Verify the note appears in the search results
    cy.get('table').should('contain', updatedName)
    
    // Clear search and verify all notes are shown again
    cy.get('[data-automation-id="note-list-search"]').find('input').clear()
    cy.wait(800)
    cy.get('table').should('exist')
  })

  it('should search for notes', () => {
    // First create a note with a unique name
    cy.visit('/notes/new')
    const timestamp = Date.now()
    const itemName = `search-test-${timestamp}`
    
    cy.get('[data-automation-id="note-new-name-input"]').type(itemName)
    cy.get('[data-automation-id="note-new-description-input"]').type('Search test description')
    cy.get('[data-automation-id="note-new-submit-button"]').click()
    cy.url().should('include', '/notes/')
    
    // Navigate to list page
    cy.visit('/notes')
    
    // Wait for initial load
    cy.get('table').should('exist')
    
    // Search for the note
    cy.get('[data-automation-id="note-list-search"]').find('input').type(itemName)
    // Wait for debounce (300ms) plus API call
    cy.wait(800)
    
    // Verify the search results contain the note
    cy.get('table tbody').should('contain', itemName)
    
    // Clear search and verify all notes are shown again
    cy.get('[data-automation-id="note-list-search"]').find('input').clear()
    cy.wait(800)
    cy.get('table').should('exist')
  })
})
