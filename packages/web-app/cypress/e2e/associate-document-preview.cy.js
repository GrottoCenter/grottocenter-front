describe('Previewing a document before association', () => {
  it('keeps preview and selection separate in table and card views', () => {
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/42' },
      {
        body: {
          id: 42,
          name: 'Test entrance',
          isDeleted: false,
          documents: [],
          massifs: [],
          locations: [],
          descriptions: [],
          riggings: [],
          histories: [],
          comments: []
        }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/types' },
      {
        body: { documentTypes: [] }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/subjects' },
      {
        body: { subjects: [] }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      {
        body: { languages: [] }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/licenses' },
      {
        body: { licenses: [] }
      }
    );
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/advanced-search' },
      {
        body: {
          results: [
            {
              id: 7,
              type: 'Article',
              title: 'Preview document',
              description: 'Document to inspect before association',
              authors: []
            }
          ],
          totalResults: 1
        }
      }
    ).as('searchDocuments');
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/7' },
      {
        body: {
          id: 7,
          title: 'Preview document',
          type: 'Article',
          files: [],
          authors: [],
          authorsOrganization: [],
          massifs: [],
          entrances: [],
          isDeleted: false,
          isValidated: true
        }
      }
    ).as('getDocument');
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/7/children' },
      {
        body: { documents: [] }
      }
    );

    cy.loginAs();
    cy.visit('/entrances/42?tab=documents', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.get('[data-testid="associate-documents-button"]', {
      timeout: 30000
    }).click();
    cy.get('input[placeholder="Search for a document..."]')
      .closest('form')
      .find('button[type="submit"]')
      .click();
    cy.wait('@searchDocuments');

    cy.contains('tr', 'Preview document').click();
    cy.wait('@getDocument');
    cy.contains('[role="dialog"]', 'Detailed document view').should(
      'contain.text',
      'Preview document'
    );
    cy.contains('[role="dialog"]', 'Detailed document view')
      .find('[aria-label="close"]')
      .click();
    cy.contains('[role="dialog"]', 'Detailed document view').should(
      'not.exist'
    );
    cy.contains('button', 'Associate 0 documents').should('be.disabled');

    cy.get('[aria-label="Card view"]').filter(':visible').first().click();
    cy.viewport(390, 844);
    cy.get('[aria-label="Preview"]').click();
    cy.contains('[role="dialog"]', 'Detailed document view').should(
      'contain.text',
      'Preview document'
    );
    cy.contains('[role="dialog"]', 'Detailed document view')
      .find('[aria-label="close"]')
      .click();
    cy.contains('[role="dialog"]', 'Detailed document view').should(
      'not.exist'
    );
    cy.contains('button', 'Associate 0 documents').should('be.disabled');

    cy.contains('Preview document').click();
    cy.contains('button', 'Associate 1 document').should('be.enabled');
  });
});
