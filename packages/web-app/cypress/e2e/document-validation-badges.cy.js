const modifiedTitle = 'Accepted survey awaiting approval of changes';

describe('Document validation badges in ordinary search', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept('GET', '**/api/v1/languages', { languages: [] });
    cy.intercept('GET', '**/api/v1/documents/types*', { documentTypes: [] });
    cy.intercept('GET', '**/api/v1/documents/subjects', { subjects: [] });
    cy.intercept('GET', '**/api/v1/licenses', { licenses: [] });
    cy.intercept('POST', '**/api/v1/advanced-search', request => {
      expect(request.body).not.to.have.property('includePendingDocuments');
      // Search payloads need no isValidated or moderation metadata.
      request.reply({
        results: [
          {
            id: 7,
            title: modifiedTitle,
            validationStatus: 'modificationPending'
          },
          { id: 8, title: 'Accepted survey', validationStatus: 'validated' },
          { id: 9, title: 'Legacy index survey' }
        ],
        totalResults: 3
      });
    }).as('search');
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/7' },
      request => {
        expect(request.query).not.to.have.property('requireUpdate');
        request.reply({
          id: 7,
          title: 'Currently accepted survey content',
          description: 'This is the accepted version.',
          type: 'Article',
          validationStatus: 'modificationPending',
          files: [],
          authors: [],
          authorsOrganization: [],
          massifs: [],
          entrances: []
        });
      }
    ).as('acceptedDocument');
    cy.intercept('GET', '**/api/v1/documents/7/children', { documents: [] });
  });

  [false, true].forEach(cards => {
    it(`shows the blue badge in ${cards ? 'mobile cards' : 'desktop rows'} and opens accepted content`, () => {
      cy.viewport(1280, 900);
      cy.visit('/documents', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'fr')
      });
      cy.wait('@search', { requestTimeout: 30000 });
      if (cards) {
        cy.get('[aria-label="Vue en cartes"]')
          .filter(':visible')
          .first()
          .click();
        cy.viewport(390, 844);
      }
      cy.get('[data-testid="document-validation-badge"]')
        .should('have.length', 1)
        .and('be.visible')
        .and('have.css', 'font-weight', '400')
        .and('have.class', 'MuiChip-colorInfo')
        .and('contain.text', 'En attente de re-validation');
      cy.get('[data-testid="document-validation-badge"]').should(([badge]) => {
        const styles = badge.ownerDocument.defaultView.getComputedStyle(badge);
        expect(styles.borderTopColor).to.equal(styles.color);
      });
      cy.get('[data-testid="document-validation-badge"]')
        .find('[data-testid="HourglassEmptyIcon"]')
        .should('be.visible');
      cy.get('[data-testid="document-validation-badge"]')
        .parents('h1,h2,h3,h4,h5,h6')
        .should('not.exist');
      cy.contains('th', 'Statut').should('not.exist');
      cy.document().then(page => {
        expect(page.documentElement.scrollWidth).to.be.at.most(
          cards ? 390 : 1280
        );
      });
      cy.screenshot(
        `document-validation-search-${cards ? 'mobile' : 'desktop'}`,
        { capture: 'viewport' }
      );
      if (cards) {
        cy.contains('a', modifiedTitle)
          .should('have.attr', 'href', '/ui/documents/7')
          .invoke('removeAttr', 'target')
          .click();
      } else {
        // Desktop rows use useOpenLink, which opens the accepted route in a tab.
        cy.window().then(win => cy.stub(win, 'open').as('openDocument'));
        cy.contains('tr', modifiedTitle).click();
        cy.get('@openDocument').should(
          'have.been.calledWithMatch',
          '/ui/documents/7'
        );
        cy.visit('/documents/7');
      }
      cy.wait('@acceptedDocument');
      cy.contains('h1', 'Currently accepted survey content')
        .should('be.visible')
        .and('have.css', 'color', 'rgb(245, 124, 0)');
      cy.get('[data-testid="document-validation-badge"]').should(
        'have.length',
        1
      );
    });
  });
});
