const authorizationOption = 'Authorization present in Grottocenter';
const permission = {
  id: 99,
  type: 'Authorization To Publish',
  title: 'Publication permission'
};
const collection = {
  id: 41,
  type: 'Collection',
  title: 'Test collection',
  license: 'CC-BY',
  authorizationDocument: permission
};
const document = {
  id: 42,
  type: 'Issue',
  title: 'Issue 42',
  description: 'Issue summary',
  authors: [{ id: 1, nickname: 'Original author' }],
  authorsOrganization: [],
  mainLanguage: 'eng',
  parent: collection,
  license: 'CC-BY',
  authorizationDocument: permission,
  files: [],
  isValidated: true
};
const licenses = [
  { id: 1, name: 'CC-BY-SA' },
  { id: 2, name: 'CC-BY' }
];

const addFile = () =>
  cy
    .get('[role="button"][aria-label="Drop files here or click to select"]')
    .should('have.attr', 'aria-disabled', 'false')
    .find('input[type="file"]')
    .selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.4 test'),
        fileName: 'issue.pdf',
        mimeType: 'application/pdf'
      },
      { force: true }
    );

const expectMultipartValue = (body, field, value) => {
  expect(body).to.include(`name="${field}"\r\n\r\n${value}\r\n`);
};

describe('Editing a document with publication authorization', () => {
  beforeEach(() => {
    cy.viewport(1280, 1000);
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept('GET', '**/api/v1/account', {
      body: { id: 1, nickname: 'Original author', language: 'eng' }
    });
    cy.intercept('GET', '**/api/v1/documents/42', { body: document });
    cy.intercept('GET', '**/api/v1/documents/41', { body: collection }).as(
      'parent'
    );
    cy.intercept('GET', '**/api/v1/documents/99', { body: permission });
    cy.intercept('GET', '**/api/v1/documents?*', {
      body: { documents: [permission] }
    });
    cy.intercept('GET', '**/api/v1/languages?*', {
      body: { languages: [{ id: 'eng', part1: 'en', refName: 'English' }] }
    });
    cy.intercept('GET', '**/api/v1/documents/types', {
      body: { documentTypes: [{ id: 3, name: 'Issue' }] }
    });
    cy.intercept('GET', '**/api/v1/file-formats', {
      body: { fileFormats: [{ mimeType: 'application/pdf', extension: 'pdf' }] }
    }).as('formats');
    cy.intercept('GET', '**/api/v1/documents/subjects', {
      body: { subjects: [] }
    });
    cy.intercept('PUT', '**/api/v1/documents/42', { body: document }).as(
      'save'
    );
    cy.loginAs({ nickname: 'Original author' });
  });

  it('saves the file and original license without reselecting the parent', () => {
    cy.intercept('GET', '**/api/v1/licenses', { body: { licenses } }).as(
      'licenses'
    );
    cy.visit('/documents/42/edit', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.wait('@formats');
    addFile();
    cy.get('[data-testid="selected-file-issue.pdf"]').should('be.visible');
    cy.get(`input[type="radio"][value="${authorizationOption}"]`)
      .should('be.checked')
      .and('be.disabled');
    cy.wait('@licenses');
    cy.get('button[type="submit"]').should('be.enabled').click();
    cy.wait('@save').then(({ request }) => {
      expectMultipartValue(request.body, 'option', authorizationOption);
      expectMultipartValue(request.body, 'license[id]', '2');
      expectMultipartValue(request.body, 'license[name]', 'CC-BY');
      expectMultipartValue(request.body, 'authorizationDocument[id]', '99');
      expectMultipartValue(request.body, 'authors[0][id]', '1');
      expect(request.body).to.include('filename="issue.pdf"');
    });
  });

  it('keeps publication inheritance working when selecting the parent', () => {
    cy.intercept('GET', '**/api/v1/licenses', { body: { licenses } });
    cy.intercept('POST', '**/api/v1/search', {
      body: { results: [{ ...collection, _type: 'documents' }] }
    }).as('search');
    cy.visit('/documents/42/edit', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.wait('@formats');
    cy.get('input[placeholder="Search for a document..."]').type(
      'Test collection'
    );
    cy.wait('@search');
    cy.contains('[role="option"]', 'Test collection').click();
    cy.wait('@parent');
    addFile();
    cy.get(`input[type="radio"][value="${authorizationOption}"]`)
      .should('be.checked')
      .and('be.disabled');
    cy.get('button[type="submit"]').should('be.enabled').click();
    cy.wait('@save').then(({ request }) => {
      expectMultipartValue(request.body, 'license[id]', '2');
      expectMultipartValue(request.body, 'authorizationDocument[id]', '99');
    });
  });
});
