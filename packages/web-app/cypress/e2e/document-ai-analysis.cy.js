const summary = '[data-testid="document-description"] textarea';

const openForm = () => {
  cy.visit('/entity/add/document', {
    onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
  });
  cy.get('[data-testid="document-type-22"]', { timeout: 30000 }).click();
  cy.get('[data-testid="document-title"] input').type('Exploration report');
  cy.get(summary).first().type('Manual summary');
  cy.get('[data-testid="file-input"]').selectFile(
    'cypress/fixtures/article-pages.pdf',
    { force: true }
  );
  cy.get('[data-testid="document-ai"]').should('be.visible');
};

describe('PDF analysis during document creation', () => {
  beforeEach(() => {
    // External font downloads must not hold the page load event in offline CI.
    cy.intercept('GET', 'https://fonts.googleapis.com/**', {
      body: '',
      headers: { 'Content-Type': 'text/css' }
    });
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept('GET', '**/api/v1/account', {
      body: { id: 1, nickname: 'TestCaver', language: 'eng' }
    });
    cy.intercept('GET', '**/api/v1/documents/types', {
      body: { documentTypes: [{ id: 22, name: 'Report' }] }
    });
    cy.intercept('GET', '**/api/v1/languages', {
      body: { languages: [{ id: 'eng', part1: 'en', refName: 'English' }] }
    });
    cy.intercept('GET', '**/api/v1/file-formats', {
      body: { fileFormats: [{ extension: 'pdf', mimeType: 'application/pdf' }] }
    });
    cy.intercept('GET', '**/api/v1/licenses', {
      body: { licenses: [{ id: 1, name: 'CC-BY-SA' }] }
    });
    [
      ['documents/subjects', 'subjects'],
      ['documents/identifierTypes', 'identifierTypes']
    ].forEach(([path, key]) => {
      cy.intercept('GET', `**/api/v1/${path}`, { body: { [key]: [] } });
    });
    cy.intercept('POST', '**/api/v1/sso/auth-token', request => {
      expect(request.body).to.deep.equal({ product: 'documents' });
      request.reply({ body: { token: 'documents-only-token' } });
    }).as('sso');
    cy.intercept('OPTIONS', '**/documents/analyze', {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      }
    });
    cy.intercept('POST', '**/documents/analyze', request => {
      expect(request.headers.authorization).to.equal(
        'Bearer documents-only-token'
      );
      expect(request.body).to.include(
        'name="file"; filename="article-pages.pdf"'
      );
      request.reply({
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: {
          message: 'success',
          filename: 'generated.pdf',
          document_metadata: [
            { descriptions: ['Suggested summary'], publication_date: '2010' },
            { parent: 'Issue', descriptions: ['Inherited article summary'] }
          ]
        }
      });
    }).as('analyze');
    cy.intercept('POST', '**/api/v1/documents', {
      body: { document: { id: 99, title: 'Exploration report' } }
    }).as('createDocument');
    cy.loginAs({ groups: ['User', 'Moderator'] });
  });

  [1280, 390].forEach(width => {
    it(`reviews, applies and saves a summary at ${width}px`, () => {
      cy.viewport(width, 1000);
      openForm();
      cy.get('@sso.all').should('have.length', 0);
      cy.get('[data-testid="document-ai-analyze"]').click();
      cy.get('[data-testid="document-ai-confirm"]').click();
      cy.wait('@sso');
      cy.wait('@analyze');
      cy.get('[data-testid="document-ai-suggestions"]')
        .should('contain.text', 'Suggested summary')
        .and('not.contain.text', 'Inherited article summary');
      cy.get(summary).first().should('have.value', 'Manual summary');
      cy.get(
        '[data-testid="document-ai-suggestions"] input[type="checkbox"]'
      ).each(checkbox => cy.wrap(checkbox).check());
      cy.get('[data-testid="document-ai-apply"]').click();
      cy.get(summary)
        .first()
        .should('have.value', 'Suggested summary')
        .type(' corrected');
      cy.get('[data-testid="publication-author-rights"]').check();
      cy.get('[data-testid="document-submit"]').should('be.enabled').click();
      cy.wait('@createDocument').then(({ request }) => {
        expect(request.body).to.include(
          'name="description"\r\n\r\nSuggested summary corrected\r\n'
        );
        expect(request.body).to.include(
          'name="datePublication"\r\n\r\n2010\r\n'
        );
        expect(request.body).to.include('filename="article-pages.pdf"');
      });
    });
  });

  it('keeps the session and the manual summary after an AI token rejection', () => {
    cy.intercept('POST', '**/documents/analyze', {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: { detail: 'Invalid token' }
    }).as('rejected');
    openForm();
    cy.get('[data-testid="document-ai-analyze"]').click();
    cy.get('[data-testid="document-ai-confirm"]').click();
    cy.wait('@rejected');
    cy.get('[role="dialog"]').should('contain.text', 'Authorization failed');
    cy.get(summary).first().should('have.value', 'Manual summary');
    cy.window().then(win =>
      expect(win.localStorage.getItem('grottocenter_token')).to.be.a('string')
    );
    cy.get('[data-testid="document-ai-analyze"]').should('be.enabled');
  });
});
