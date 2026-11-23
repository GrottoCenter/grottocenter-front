const dateField = '[data-testid="document-publication-date"]';

describe('Photo capture date during document creation', () => {
  beforeEach(() => {
    cy.intercept('GET', 'https://fonts.googleapis.com/**', {
      body: '',
      headers: { 'Content-Type': 'text/css' }
    });
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    const responses = [
      ['account', { id: 1, nickname: 'TestCaver', language: 'eng' }],
      ['documents/types', { documentTypes: [{ id: 1, name: 'Image' }] }],
      [
        'languages',
        {
          languages: [{ id: 'eng', part1: 'en', refName: 'English' }]
        }
      ],
      [
        'file-formats',
        {
          fileFormats: [{ extension: 'jpg', mimeType: 'image/jpeg' }]
        }
      ],
      ['licenses', { licenses: [{ id: 1, name: 'CC-BY-SA' }] }],
      ['documents/subjects', { subjects: [] }],
      ['documents/identifierTypes', { identifierTypes: [] }]
    ];
    responses.forEach(([path, body]) => {
      cy.intercept({ method: 'GET', pathname: `/api/v1/${path}` }, { body });
    });
    cy.intercept('POST', '**/api/v1/documents', {
      body: { document: { id: 99, title: 'Entrance photo' } }
    }).as('createDocument');
    cy.loginAs({ groups: ['User'] });
  });

  [1280, 390].forEach(width => {
    it(`prefills, edits and saves a photo date outside advanced metadata at ${width}px`, () => {
      cy.viewport(width, 1000);
      cy.visit('/entity/add/document', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
      });
      cy.get('[data-testid="document-type-1"]', { timeout: 30000 }).click();
      cy.get(dateField).should('be.visible');
      cy.get('[data-testid="document-advanced-metadata"]')
        .find('[aria-expanded]')
        .should('have.attr', 'aria-expanded', 'false');
      cy.get('[data-testid="document-title"] input').type('Entrance photo');
      cy.get(dateField).find('button[value="full"]').click();
      cy.get('[data-testid="file-input"]').selectFile(
        'cypress/fixtures/photo-dates/capture.jpg',
        { force: true }
      );
      cy.get(dateField).find('input').should('have.value', '29/02/2012');
      cy.get(dateField).find('[role="spinbutton"][aria-label="Year"]').click();
      cy.get(dateField)
        .find('[role="spinbutton"][aria-label="Year"]')
        .type('2016');
      cy.get(dateField).find('input').should('have.value', '29/02/2016');

      cy.fixture('photo-dates/capture.jpg', null).then(contents => {
        cy.get('[data-testid="file-input"]').selectFile(
          { contents, fileName: 'second.jpg', mimeType: 'image/jpeg' },
          { force: true }
        );
      });
      cy.get('[data-testid="selected-file-second.jpg"]').should('be.visible');
      cy.get(dateField).find('input').should('have.value', '29/02/2016');
      cy.get('[data-testid="publication-author-rights"]').check();
      cy.get('[data-testid="document-submit"]').should('be.enabled').click();
      cy.wait('@createDocument').then(({ request }) => {
        expect(request.body).to.include(
          'name="datePublication"\r\n\r\n2016-02-29\r\n'
        );
        expect(request.body).to.include('filename="capture.jpg"');
        expect(request.body).to.include('filename="second.jpg"');
      });
    });
  });
});
