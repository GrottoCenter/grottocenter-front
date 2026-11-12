const documents = [
  {
    id: 7,
    title: 'Alpha article',
    type: 'Article',
    files: [],
    authors: [],
    authorsOrganization: []
  },
  {
    id: 8,
    title: 'Zeta issue',
    type: 'Issue',
    files: [],
    authors: [],
    authorsOrganization: []
  }
];

describe('Sorting entrance documents from the section header', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/42' },
      {
        body: {
          id: 42,
          name: 'Test entrance',
          isDeleted: false,
          documents,
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
      { method: 'GET', pathname: '/api/v1/languages' },
      { body: { languages: [] } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/licenses' },
      { body: { licenses: [] } }
    );
    cy.loginAs();
  });

  [320, 390, 1280].forEach(width => {
    it(`shares one accessible sort control with the section actions at ${width}px`, () => {
      cy.viewport(width, 900);
      cy.visit('/entrances/42?tab=documents', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
      });
      cy.get('#documents').should('be.visible');
      cy.get('#documents [role="combobox"][aria-label="Sort by"]')
        .should('have.length', 1)
        .and('be.visible');
      cy.get('[data-testid="entrance-document-actions"]').then($actions => {
        const section = $actions[0].closest('#documents');
        const sortControl = section.querySelector('[role="combobox"]');
        const description = sortControl.ownerDocument.getElementById(
          sortControl.getAttribute('aria-describedby')
        );
        expect(description.textContent).to.eq('Document type');
        const sort = sortControl.getBoundingClientRect();
        const actions = $actions[0].getBoundingClientRect();
        expect(sort.top).to.be.lessThan(actions.bottom);
        expect(sort.bottom).to.be.greaterThan(actions.top);
        expect(sort.right).to.be.at.most(actions.left);
        expect(actions.right).to.be.at.most(width);
        expect(sortControl.textContent.trim()).to.eq(
          width < 900 ? '' : 'Document type'
        );
      });
      cy.get('#documents [role="combobox"][aria-label="Sort by"]').click();
      cy.get('[role="tooltip"]').should('not.exist');
      cy.get('[role="option"][aria-selected="true"]').should(
        'have.text',
        'Document type'
      );
      cy.contains('[role="option"]', 'Title').click();
      cy.get('#documents [role="combobox"]').should($control => {
        const description = $control[0].ownerDocument.getElementById(
          $control.attr('aria-describedby')
        );
        expect(description.textContent).to.eq('Title');
      });
      cy.get('#documents').should($section => {
        const links = Array.from($section[0].querySelectorAll('a'));
        const first = links.find(link => link.textContent === 'Alpha article');
        const second = links.find(link => link.textContent === 'Zeta issue');
        expect(first.compareDocumentPosition(second)).to.eq(
          Node.DOCUMENT_POSITION_FOLLOWING
        );
      });
      cy.screenshot(`entrance-document-controls-${width}`);
    });
  });
});
