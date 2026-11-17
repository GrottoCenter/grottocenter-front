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

describe('PDF analysis during document creation and editing', () => {
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
      body: {
        languages: [
          { id: 'eng', part1: 'en', refName: 'English' },
          { id: 'cat', part1: 'ca', refName: 'Catalan' }
        ]
      }
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
            {
              title: 'Suggested title',
              languages: ['cat'],
              descriptions: ['Suggested summary'],
              publication_date: '2010'
            },
            { parent: 'Issue', descriptions: ['Inherited article summary'] }
          ]
        }
      });
    }).as('analyze');
    cy.intercept('POST', '**/api/v1/documents', {
      body: { document: { id: 99, title: 'Exploration report' } }
    }).as('createDocument');
    cy.loginAs({ groups: ['User'] });
  });

  [1280, 390].forEach(width => {
    it(`reviews, applies and saves title, language, summary and date at ${width}px`, () => {
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
        expect(request.body).to.include(
          'name="title"\r\n\r\nSuggested title\r\n'
        );
        expect(request.body).to.include('name="mainLanguage"\r\n\r\ncat\r\n');
        expect(request.body).to.include('filename="article-pages.pdf"');
      });
    });
  });

  [1280, 390].forEach(width => {
    it(`analyzes an existing PDF as a regular user and saves metadata without reuploading at ${width}px`, () => {
      const attachment = {
        id: 9,
        fileName: 'article-pages.pdf',
        completePath: 'https://documents.example.org/article-pages.pdf'
      };
      const document = {
        id: 7,
        type: 'Report',
        title: 'Existing report',
        description: 'Original summary',
        mainLanguage: 'eng',
        datePublication: '2015',
        authors: [{ id: 1, nickname: 'TestCaver' }],
        authorsOrganization: [],
        files: [attachment],
        license: 'CC-BY-SA',
        option: 'Author created this document',
        isValidated: true,
        isDeleted: false
      };
      cy.viewport(width, 1000);
      cy.intercept('GET', '**/api/v1/documents/7', { body: document });
      cy.intercept('GET', attachment.completePath, {
        fixture: 'article-pages.pdf,null',
        headers: {
          'Content-Type': 'application/pdf',
          'Access-Control-Allow-Origin': '*'
        }
      }).as('storedPdf');
      cy.intercept('PUT', '**/api/v1/documents/7', { body: { id: 7 } }).as(
        'updateDocument'
      );
      cy.visit('/documents/7/edit', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
      });
      cy.get('[data-testid="selected-file-article-pages.pdf"]').within(() => {
        cy.get('[data-testid="document-ai-analyze"]').should(
          'have.class',
          'MuiButton-colorSecondary'
        );
        cy.get('[data-testid="document-ai-analyze"]').should(
          'have.class',
          'MuiButton-outlined'
        );
        cy.get(
          '[data-testid="open-selected-file"], [data-testid="document-ai-analyze"], [data-testid="remove-selected-file"]'
        ).then(actions => {
          expect(
            [...actions].map(action => action.dataset.testid)
          ).to.deep.equal([
            'open-selected-file',
            'document-ai-analyze',
            'remove-selected-file'
          ]);
        });
        cy.get('[data-testid="document-ai-analyze"]').click();
      });
      cy.get('[data-testid="document-title"]').then(title => {
        cy.get('[data-testid="selected-file-article-pages.pdf"]').then(file => {
          expect(file[0].compareDocumentPosition(title[0])).to.equal(
            Node.DOCUMENT_POSITION_FOLLOWING
          );
        });
        cy.get('[data-testid="document-description"]').then(description => {
          expect(title[0].compareDocumentPosition(description[0])).to.equal(
            Node.DOCUMENT_POSITION_FOLLOWING
          );
        });
      });
      cy.get('@storedPdf.all').should('have.length', 0);
      cy.get('[data-testid="document-ai-confirm"]').click();
      cy.wait('@storedPdf');
      cy.wait('@sso');
      cy.wait('@analyze');
      cy.get(
        '[data-testid="document-ai-field-description"] [data-testid="document-ai-current-value"]'
      ).scrollIntoView();
      cy.get(
        '[data-testid="document-ai-field-description"] [data-testid="document-ai-current-value"]'
      )
        .should('be.visible')
        .and('contain.text', 'Original summary');
      cy.get(
        '[data-testid="document-ai-suggestions"] input[type="checkbox"]'
      ).each(checkbox => {
        cy.wrap(checkbox).should('not.be.checked').check();
      });
      cy.get('[data-testid="document-ai-selection"]')
        .should('contain.text', '4 fields selected')
        .and('contain.text', '4 replacements');
      cy.get('[data-testid="document-ai-apply"]').click();
      cy.get(summary).first().should('have.value', 'Suggested summary');
      cy.get('[data-testid="document-submit"]').should('be.enabled').click();
      cy.wait('@updateDocument').then(({ request }) => {
        expect(request.body).to.include(
          'name="description"\r\n\r\nSuggested summary\r\n'
        );
        expect(request.body).to.include(
          'name="datePublication"\r\n\r\n2010\r\n'
        );
        expect(request.body).to.include(
          'name="title"\r\n\r\nSuggested title\r\n'
        );
        expect(request.body).to.include('name="mainLanguage"\r\n\r\ncat\r\n');
        expect(request.body).not.to.include('filename="article-pages.pdf"');
        expect(request.body).not.to.include('deletedFiles');
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
