const submitSearch = () =>
  cy
    .get('input[placeholder="Search for a document..."]')
    .closest('form')
    .find('button[type="submit"]')
    .click();

const chooseFiles = label => {
  cy.contains('button', /^Advanced filters/).then(toggle => {
    if (toggle.attr('aria-expanded') === 'false') cy.wrap(toggle).click();
  });
  cy.get('[role="group"][aria-label="File available"]').within(() => {
    cy.contains('[role="button"]', label).click();
  });
};

const visitDocuments = (locale = 'en') =>
  cy.visit('/documents?authors.nickname=Test', {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', locale);
      win.localStorage.setItem('entityTable_rowsPerPage', '20');
      win.localStorage.setItem(
        'entityTable_documents_columns',
        '["title","hasFiles"]'
      );
      win.localStorage.setItem(
        'entityTable_documents_columnOrder',
        '["title","hasFiles"]'
      );
    }
  });

describe('Document file availability and column preferences', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.mockApiCatchAll();
    cy.intercept('GET', '**/api/v1/languages', { languages: [] });
    cy.intercept('GET', '**/api/v1/documents/types*', { documentTypes: [] });
    cy.intercept('GET', '**/api/v1/documents/subjects', { subjects: [] });
    cy.intercept('POST', '**/api/v1/advanced-search', req => {
      const page = req.body.page ?? 1;
      let results = [
        { id: page * 10, title: `With file page ${page}`, hasFiles: true },
        {
          id: page * 10 + 1,
          title: `Without file page ${page}`,
          hasFiles: false
        },
        {
          id: page * 10 + 2,
          title: `Unknown availability page ${page}`,
          identifier: 'https://example.org/book.pdf'
        }
      ];
      if (typeof req.body.filter?.hasFiles === 'boolean') {
        results = results.filter(
          doc => doc.hasFiles === req.body.filter.hasFiles
        );
      }
      if (req.body.sort === 'hasFiles:asc') results.reverse();
      req.reply({ results, totalResults: 40 });
    }).as('search');
    cy.intercept('POST', '**/api/v1/advanced-search/export*', {
      statusCode: 200,
      headers: { 'Content-Type': 'text/csv' },
      body: 'title,hasFiles\nYes,true'
    }).as('export');
  });

  it('preserves a false file filter, search and author while sorting, paging and exporting', () => {
    visitDocuments();
    cy.wait('@search');
    cy.get('input[placeholder="Search for a document..."]').type('cave');
    chooseFiles('No');
    submitSearch();
    cy.wait('@search').then(({ request }) => {
      expect(request.body.filter).to.include({
        hasFiles: false,
        'authors.nickname': 'Test'
      });
    });
    cy.contains('Without file page 1')
      .closest('tr')
      .find('svg[role="img"] title')
      .should('have.text', 'No');
    cy.get('[data-testid="sort-hasFiles"]').click();
    cy.wait('@search').its('request.body.sort').should('eq', 'hasFiles:asc');
    cy.get('[data-testid="sort-hasFiles"]').click();
    cy.wait('@search').its('request.body.sort').should('eq', 'hasFiles:desc');
    cy.get('button[aria-label="Next page"]').click();
    cy.wait('@search').then(({ request }) => {
      expect(request.body).to.include({
        query: 'cave',
        page: 2,
        sort: 'hasFiles:desc'
      });
      expect(request.body.filter).to.include({
        hasFiles: false,
        'authors.nickname': 'Test'
      });
    });
    cy.contains('button', 'Export to CSV').click();
    cy.wait('@export').then(({ request }) => {
      const body =
        typeof request.body === 'string'
          ? JSON.parse(request.body)
          : request.body;
      expect(body.filter.hasFiles).to.equal(false);
      expect(body.columns).to.deep.equal(['title', 'hasFiles']);
    });
    chooseFiles('Yes');
    submitSearch();
    cy.wait('@search').its('request.body.filter.hasFiles').should('eq', true);
    cy.contains('With file page 1')
      .closest('tr')
      .find('svg[role="img"] title')
      .should('have.text', 'Yes');
    chooseFiles('All');
    submitSearch();
    cy.wait('@search').its('request.body.filter.hasFiles').should('eq', '');
    cy.contains('Unknown availability page 1')
      .closest('tr')
      .should('contain', '-');
    cy.screenshot('document-search-desktop', { capture: 'fullPage' });
  });

  it('changes column order without toggling visibility and restores it after reload', () => {
    visitDocuments();
    cy.wait('@search');
    cy.contains('button', 'Change columns').click();
    cy.get('[data-testid="move-column-title-down"]').click();
    cy.get('[data-testid="move-column-hasFiles-up"]').should('be.disabled');
    cy.get('[data-testid="column-option-hasFiles"] input').should('be.checked');
    cy.screenshot('document-search-columns-desktop', { capture: 'fullPage' });
    cy.get('body').type('{esc}');
    cy.get('thead th').then(cells => {
      expect([...cells].map(cell => cell.textContent.trim())).to.deep.equal([
        'File available',
        'Title'
      ]);
    });
    cy.reload();
    cy.wait('@search');
    cy.get('thead th').first().should('contain', 'File available');
  });

  it('filters and sorts cards and exposes column controls on phones', () => {
    cy.viewport(390, 720);
    visitDocuments();
    cy.wait('@search');
    cy.get('button[aria-label="Card view"]').click();
    chooseFiles('Yes');
    submitSearch();
    cy.wait('@search').its('request.body.filter.hasFiles').should('eq', true);
    cy.contains('button', 'Sort by').click();
    cy.contains('[role="menuitem"]', 'File available').click();
    cy.wait('@search').its('request.body.sort').should('eq', 'hasFiles:asc');
    cy.contains('button', 'File available').click();
    cy.contains('[role="menuitem"]', 'File available').click();
    cy.wait('@search').its('request.body.sort').should('eq', 'hasFiles:desc');
    cy.contains('With file page 1').should('be.visible');
    cy.screenshot('document-search-mobile', { capture: 'fullPage' });
    cy.contains('button', 'Data').click();
    cy.get('[data-testid="move-column-title-down"]').click();
    cy.get('[data-testid="column-option-hasFiles"] input').should('be.checked');
    cy.screenshot('document-search-columns-mobile', { capture: 'fullPage' });
  });

  it('keeps focus in the same row at both column-order boundaries', () => {
    visitDocuments();
    cy.wait('@search');
    cy.contains('button', 'Change columns').click();
    cy.get('[data-testid="move-column-hasFiles-up"]').click();
    cy.get('[data-testid="move-column-hasFiles-up"]').should('be.disabled');
    cy.get('[data-testid="move-column-hasFiles-down"]').should('be.focused');

    cy.get('[data-testid^="column-option-"]')
      .last()
      .prev()
      .within(() => {
        cy.get('[data-testid$="-up"]').as('reverseMove', { type: 'static' });
        cy.get('[data-testid$="-down"]').as('moveToBottom', { type: 'static' });
      });
    cy.get('@moveToBottom').click();
    cy.get('@moveToBottom').should('be.disabled');
    cy.get('@reverseMove').should('be.focused');
  });

  it('keeps the French file filter inside advanced filters with a visible summary', () => {
    cy.viewport(390, 720);
    visitDocuments('fr');
    cy.wait('@search');
    cy.get('[role="group"][aria-label="Fichier disponible"]').should(
      'not.be.visible'
    );
    cy.contains('button', /^Filtres avancés/).click();
    cy.get('[role="group"][aria-label="Fichier disponible"]').as('fileChoices');
    cy.get('@fileChoices').within(() => {
      cy.contains('[role="button"]', /^Tous$/).should(
        'have.attr',
        'aria-pressed',
        'true'
      );
      cy.contains('[role="button"]', /^Oui$/).should('be.visible');
      cy.contains('[role="button"]', /^Non$/).click();
    });
    cy.screenshot('document-file-filter-fr-mobile-expanded', {
      capture: 'fullPage'
    });
    cy.contains('button', /^Filtres avancés/)
      .as('advancedToggle')
      .should('contain', '1');
    cy.get('@advancedToggle').click();
    cy.contains('[role="button"]', 'Fichier disponible: non').should(
      'be.visible'
    );
    cy.get('@fileChoices')
      .closest('form')
      .find('button[type="submit"]')
      .click();
    cy.wait('@search').its('request.body.filter.hasFiles').should('eq', false);
    cy.screenshot('document-file-filter-fr-mobile', { capture: 'fullPage' });
  });
});
