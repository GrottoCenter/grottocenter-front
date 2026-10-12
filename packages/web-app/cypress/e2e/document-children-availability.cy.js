const collection = {
  id: 1,
  title: 'Test collection',
  type: 'Collection',
  isValidated: true,
  isDeleted: false,
  files: [],
  authors: [],
  authorsOrganization: [],
  massifs: [],
  entrances: []
};

const issue = { ...collection, id: 2, title: 'Test issue', type: 'Issue' };
const article = {
  ...collection,
  id: 4,
  title: 'Test article',
  type: 'Article'
};

const visitDocument = id => {
  cy.visit(`/documents/${id}`, {
    onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
  });
};

describe('Document children file availability', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    [collection, issue, article].forEach(document => {
      cy.intercept(
        { method: 'GET', pathname: `/api/v1/documents/${document.id}` },
        { body: document }
      );
    });
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/1/children' },
      {
        body: {
          documents: [
            { id: 2, type: 'Issue', title: 'Test issue', hasFiles: true },
            {
              id: 3,
              type: 'Issue',
              title: 'Unavailable issue',
              hasFiles: false
            }
          ]
        }
      }
    ).as('collectionChildren');
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/2/children' },
      {
        body: {
          documents: [
            { id: 4, type: 'Article', title: 'Test article', hasFiles: true },
            {
              id: 5,
              type: 'Article',
              title: 'Unavailable article',
              hasFiles: false,
              files: [{ fileName: 'unvalidated.pdf' }]
            }
          ]
        }
      }
    ).as('issueChildren');
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/4/children' },
      { body: { documents: [] } }
    );
  });

  it('marks available issues and opens their document page', () => {
    visitDocument(1);
    cy.wait('@collectionChildren');
    cy.get('[data-testid="document-availability-legend"]').should('be.visible');
    cy.get('[data-testid="document-child-tile"][href="/ui/documents/3"]')
      .find('[data-testid="document-availability-marker"]')
      .should('not.exist');
    cy.get('[data-testid="document-child-tile"][href="/ui/documents/2"]')
      .find('[data-testid="document-availability-marker"]')
      .should('be.visible');
    cy.get(
      '[data-testid="document-child-tile"][href="/ui/documents/2"]'
    ).click();
    cy.location('pathname').should('eq', '/ui/documents/2');
    cy.contains('h1', 'Test issue').should('be.visible');
  });

  it('marks available articles and respects false even with file metadata', () => {
    visitDocument(2);
    cy.wait('@issueChildren');
    cy.get('[data-testid="document-availability-legend"]').should('be.visible');
    cy.contains('[data-testid="document-child-row"]', 'Unavailable article')
      .find('[data-testid="document-availability-marker"]')
      .should('not.exist');
    cy.contains('[data-testid="document-child-row"]', 'Test article')
      .find('[data-testid="document-availability-marker"]')
      .should('be.visible');
    cy.contains('[data-testid="document-child-row"] a', 'Test article')
      .should('have.attr', 'href', '/ui/documents/4')
      .click();
    cy.location('pathname').should('eq', '/ui/documents/4');
    cy.contains('h1', 'Test article').should('be.visible');
  });

  it('hides the legend when no issue has a validated file', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/1/children' },
      {
        body: {
          documents: [
            { id: 2, type: 'Issue', title: 'Test issue', hasFiles: false }
          ]
        }
      }
    ).as('unavailableChildren');
    visitDocument(1);
    cy.wait('@unavailableChildren');
    cy.get('[data-testid="document-child-tile"]').should('be.visible');
    cy.get('[data-testid="document-availability-marker"]').should('not.exist');
    cy.get('[data-testid="document-availability-legend"]').should('not.exist');
  });
});
