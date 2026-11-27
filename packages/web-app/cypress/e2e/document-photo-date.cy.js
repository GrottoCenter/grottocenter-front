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
      cy.get('[data-testid="document-authors"]').should('be.visible');
      cy.get('[data-testid="document-author-me"]').should('not.exist');
      cy.get('[data-testid="file-input"]').should($files => {
        const title = $files[0].ownerDocument.querySelector(
          '[data-testid="document-title"]'
        );
        expect($files[0].compareDocumentPosition(title)).to.equal(
          Node.DOCUMENT_POSITION_FOLLOWING
        );
      });
      cy.get('[data-testid="document-advanced-metadata"]')
        .find('[aria-expanded]')
        .should('have.attr', 'aria-expanded', 'false');
      cy.get('[data-testid="document-title"] input').type('Entrance photo');
      cy.get('[data-testid="file-input"]').selectFile(
        'cypress/fixtures/photo-dates/capture.jpg',
        { force: true }
      );
      cy.get(dateField).find('input').should('have.value', '2012-02-29');
      cy.get(dateField).find('input').clear();
      cy.get(dateField).find('input').type('2016-02-29');
      cy.get(dateField).find('input').blur();
      cy.get(dateField).find('input').should('have.value', '2016-02-29');

      cy.fixture('photo-dates/capture.jpg', null).then(contents => {
        cy.get('[data-testid="file-input"]').selectFile(
          { contents, fileName: 'second.jpg', mimeType: 'image/jpeg' },
          { force: true }
        );
      });
      cy.get('[data-testid="selected-file-second.jpg"]').should('be.visible');
      cy.get(dateField).find('input').should('have.value', '2016-02-29');
      cy.get('[data-testid="document-author-me"]').check();
      cy.get('[data-testid="publication-author-rights"]').should('not.exist');
      cy.get('[data-testid="document-license"]')
        .find('img[alt="CC-BY-SA"]')
        .should('be.visible');
      cy.get('[data-testid="document-license"]').scrollIntoView({
        offset: { top: -270, left: 0 }
      });
      cy.screenshot(`photo-author-and-sharing-${width}`, {
        capture: 'viewport'
      });
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

  it('guides third-party sharing and keeps fallback authors in a secondary menu on mobile', () => {
    cy.viewport(390, 720);
    cy.visit('/entity/add/document', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.get('[data-testid="document-type-1"]').click();
    cy.get('[data-testid="file-picker"]').should('be.enabled');
    cy.get('[data-testid="file-input"]').selectFile(
      'cypress/fixtures/photo-dates/capture.jpg',
      { force: true }
    );
    cy.get('[data-testid="document-author-other"]').check();
    cy.get('[data-testid="publication-author-rights"]').should('not.exist');
    cy.contains('button', 'Unknown author').click();
    cy.contains('[role="menuitem"]', 'Multiple unknown authors').click();
    cy.get('[data-testid="document-author-persons-41378"]').should(
      'be.visible'
    );
    cy.get('[data-testid="publication-license-in-file"]').check();
    cy.get('[data-testid="document-submit"]').should('be.enabled').click();
    cy.get('[data-testid="document-title"] input')
      .should('be.focused')
      .and('have.attr', 'aria-invalid', 'true');
    cy.contains('[role="alert"]', 'A title is required.').should('be.visible');
    cy.get('@createDocument.all').should('have.length', 0);
    cy.get('[data-testid="document-title"] input').type(
      'An archived photograph'
    );
    cy.get('[data-testid="document-submit"]').click();
    cy.get('[data-testid="document-license"] [role="combobox"]').should(
      'be.focused'
    );
    cy.contains('Select a license').should('be.visible');
    cy.get('[data-testid="document-license"] [role="combobox"]').click();
    cy.get('[data-testid="document-license-option-1"]').click();
    cy.contains('button', 'help me choose').click();
    cy.contains('check with the rights holder').should('be.visible');
    cy.get('[data-testid="document-submit"]').click();
    cy.wait('@createDocument')
      .its('request.body')
      .should('include', 'name="authors[0][id]"\r\n\r\n41378\r\n');
  });
});
