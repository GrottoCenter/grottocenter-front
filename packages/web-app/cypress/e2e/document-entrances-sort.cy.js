describe('Document search entrance sorting', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.mockApiCatchAll();
    cy.intercept('GET', '**/api/v1/languages', { languages: [] });
    cy.intercept('GET', '**/api/v1/documents/types*', { documentTypes: [] });
    cy.intercept('GET', '**/api/v1/documents/subjects', { subjects: [] });
    cy.intercept('POST', '**/api/v1/advanced-search', req => {
      const page = req.body.page ?? 1;
      const order = req.body.sort || 'default';
      req.reply({
        results: [
          {
            id: page,
            title: `Server result ${order} page ${page}`,
            entrances: [{ id: 42, name: 'Aven Armand' }]
          }
        ],
        totalResults: 40
      });
    }).as('search');
  });

  it('sends both sort directions and preserves the search across pagination', () => {
    cy.visit('/documents?authors.nickname=Test', {
      onBeforeLoad: win => {
        win.localStorage.setItem('selectedLanguage', 'en');
        win.localStorage.setItem('entityTable_rowsPerPage', '20');
        win.localStorage.setItem(
          'entityTable_documents_columns',
          JSON.stringify(['title', 'entrances'])
        );
      }
    });
    cy.wait('@search');
    cy.get('input[placeholder="Search for a document..."]').type('cave');
    cy.get('button[type="submit"]').click();
    cy.wait('@search').its('request.body').as('submittedSearch');

    cy.contains('th', 'Entrances').as('entrancesColumn');
    cy.get('@entrancesColumn').find('[role="button"]').click();
    cy.wait('@search').then(({ request }) => {
      cy.get('@submittedSearch').then(submitted => {
        expect(request.body).to.deep.equal({
          ...submitted,
          sort: 'entrancesSort:asc'
        });
      });
    });
    cy.get('@entrancesColumn').should('have.attr', 'aria-sort', 'ascending');
    cy.contains('Server result entrancesSort:asc page 1').should('be.visible');

    cy.get('button[aria-label="Next page"]').click();
    cy.wait('@search').then(({ request }) => {
      expect(request.body).to.include({
        entity: 'documents',
        query: 'cave',
        sort: 'entrancesSort:asc',
        page: 2
      });
      expect(request.body.filter).to.include({ 'authors.nickname': 'Test' });
    });
    cy.contains('Server result entrancesSort:asc page 2').should('be.visible');

    cy.get('@entrancesColumn').find('[role="button"]').click();
    cy.wait('@search').then(({ request }) => {
      expect(request.body).to.include({
        entity: 'documents',
        query: 'cave',
        sort: 'entrancesSort:desc',
        page: 2
      });
      expect(request.body.filter).to.include({ 'authors.nickname': 'Test' });
    });
    cy.get('@entrancesColumn').should('have.attr', 'aria-sort', 'descending');
    cy.contains('Server result entrancesSort:desc page 2').should('be.visible');
  });
});
