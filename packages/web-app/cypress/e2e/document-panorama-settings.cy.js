const files = [
  {
    id: 10,
    fileName: 'stored.jpg',
    completePath: '/stored.jpg',
    isPanorama: true
  },
  {
    id: 11,
    fileName: 'other.jpg',
    completePath: '/other.jpg',
    isPanorama: false
  }
];
const document = {
  id: 7,
  type: 'Image',
  title: 'Cave panorama',
  description: 'Cave',
  isValidated: true,
  authors: [{ id: 1, nickname: 'TestCaver' }],
  authorsOrganization: [],
  files,
  mainLanguage: 'eng',
  license: 'CC-BY-SA',
  option: 'Author created this document'
};
const visit = path =>
  cy.visit(path, {
    onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
  });
const upload = names => {
  // Dropzone's hidden input stays enabled while the format query loads. Wait
  // for the visible upload control, whose disabled state owns that readiness.
  cy.get('[data-testid="file-dropzone"], [data-testid="file-picker"]').should(
    ([control]) => {
      if (control.tagName === 'BUTTON')
        expect(control.disabled).to.equal(false);
      else expect(control.getAttribute('aria-disabled')).to.equal('false');
    }
  );
  cy.get('input[type="file"]')
    .should('be.enabled')
    .selectFile(
      names.map(fileName => ({
        contents: Cypress.Buffer.from('image'),
        fileName,
        mimeType: 'image/jpeg'
      })),
      { force: true }
    );
};
const expectValue = (body, field, value) =>
  expect(body).to.include(`name="${field}"\r\n\r\n${value}\r\n`);
const submit = () => {
  cy.get('[data-testid="document-submit"]').then(([button]) =>
    button.scrollIntoView({ behavior: 'instant', block: 'center' })
  );
  cy.get('[data-testid="document-submit"]').click({ scrollBehavior: false });
};

describe('Panorama attachment settings', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/account' },
      {
        body: { id: 1, nickname: 'TestCaver', language: 'eng' }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/7' },
      { body: document }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      {
        body: { languages: [{ id: 'eng', part1: 'en', refName: 'English' }] }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/types' },
      {
        body: { documentTypes: [{ id: 1, name: 'Image' }] }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/licenses' },
      {
        body: { licenses: [{ id: 1, name: 'CC-BY-SA' }] }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/file-formats' },
      {
        body: { fileFormats: [{ extension: 'jpg', mimeType: 'image/jpeg' }] }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/subjects' },
      {
        body: { subjects: [] }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/identifierTypes' },
      {
        body: { identifierTypes: [] }
      }
    );
    cy.intercept('PUT', '**/api/v1/documents/7', { body: document }).as(
      'update'
    );
    cy.intercept('POST', '**/api/v1/documents', {
      body: { document: { id: 8 } }
    }).as('create');
    cy.loginAs();
  });

  [1280, 390].forEach(width => {
    it(`preserves untouched existing files and submits explicit new choices at ${width}px`, () => {
      cy.viewport(width, 1000);
      visit('/documents/7/edit');
      cy.get('[data-testid="panorama-display-toggle"]')
        .should('have.length', 2)
        .first()
        .should('have.attr', 'aria-expanded', 'false');
      upload(['auto.jpg', 'on.jpg', 'off.jpg']);
      cy.get('[data-testid="selected-file-on.jpg"]').within(() => {
        cy.get('[data-testid="panorama-display-toggle"]').click();
        cy.get('[data-testid="panorama-display-checkbox"]')
          .should('have.attr', 'aria-checked', 'mixed')
          .check();
      });
      cy.get('[data-testid="selected-file-off.jpg"]').within(() => {
        cy.get('[data-testid="panorama-display-toggle"]').click();
        cy.get('[data-testid="panorama-display-checkbox"]').check();
        cy.get('[data-testid="panorama-display-checkbox"]').uncheck();
      });
      cy.get('[data-testid="selected-files"]').should(([list]) => {
        expect(list.scrollWidth).to.be.at.most(list.clientWidth);
      });
      cy.get('[data-testid="selected-file-off.jpg"]').screenshot(
        `panorama-setting-${width}px`
      );
      submit();
      cy.wait('@update').then(({ request }) => {
        expect(request.body).not.to.include('name="modifiedFiles');
        expect(request.body).not.to.include(
          'name="newFilesMetadata[0][isPanorama]"'
        );
        expectValue(request.body, 'newFilesMetadata[0][fileName]', 'auto.jpg');
        expectValue(request.body, 'newFilesMetadata[1][isPanorama]', 'true');
        expectValue(request.body, 'newFilesMetadata[2][isPanorama]', 'false');
      });
    });
  });

  it('submits an existing-file correction and shows the API error on that file', () => {
    cy.intercept('PUT', '**/api/v1/documents/7', {
      statusCode: 400,
      body: {
        code: 'E_INCOMPATIBLE_PANORAMA',
        message: 'incompatible',
        metadata: {
          field: 'modifiedFiles[0][isPanorama]',
          fileName: 'other.jpg',
          reason: 'INVALID_DIMENSIONS'
        }
      }
    }).as('invalid');
    visit('/documents/7/edit');
    cy.get('[data-testid="selected-file-other.jpg"]').within(() => {
      cy.get('[data-testid="panorama-display-toggle"]').click();
      cy.get('[data-testid="panorama-display-checkbox"]').check();
    });
    submit();
    cy.wait('@invalid').then(({ request }) => {
      expectValue(request.body, 'modifiedFiles[0][id]', '11');
      expectValue(request.body, 'modifiedFiles[0][isPanorama]', 'true');
    });
    cy.get('[data-testid="selected-file-other.jpg"]').within(() => {
      cy.get('[role="alert"]').should(
        'contain',
        'This image cannot be displayed as a panorama'
      );
      cy.get('[data-testid="panorama-display-checkbox"]').uncheck();
      cy.get('[role="alert"]').should('not.exist');
    });
    cy.intercept('PUT', '**/api/v1/documents/7', { body: document }).as(
      'corrected'
    );
    submit();
    cy.wait('@corrected').then(({ request }) =>
      expectValue(request.body, 'modifiedFiles[0][isPanorama]', 'false')
    );
  });

  it('creates a document with automatic, enabled and disabled uploads', () => {
    visit('/entity/add/document');
    cy.contains('[data-testid="document-type-name"]', 'Image', {
      timeout: 30000
    }).click();
    cy.get('[data-testid="document-title"] input').type('Cave panorama');
    upload(['auto.jpg', 'on.jpg', 'off.jpg']);
    cy.get('[data-testid="document-author-me"]').check();
    cy.get('[data-testid="publication-author-rights"]').check();
    cy.get('[data-testid="selected-file-on.jpg"]').within(() => {
      cy.get('[data-testid="panorama-display-toggle"]').click();
      cy.get('[data-testid="panorama-display-checkbox"]').check();
    });
    cy.get('[data-testid="selected-file-off.jpg"]').within(() => {
      cy.get('[data-testid="panorama-display-toggle"]').click();
      cy.get('[data-testid="panorama-display-checkbox"]').check();
      cy.get('[data-testid="panorama-display-checkbox"]').uncheck();
    });
    submit();
    cy.wait('@create').then(({ request }) => {
      expect(request.body).not.to.include(
        'name="newFilesMetadata[0][isPanorama]"'
      );
      expectValue(request.body, 'newFilesMetadata[1][isPanorama]', 'true');
      expectValue(request.body, 'newFilesMetadata[2][isPanorama]', 'false');
    });
    cy.contains('Your document has been successfully submitted').should(
      'be.visible'
    );
  });

  it('shows a proposed flag in moderation and preserves corrections when editing the proposal', () => {
    const stored = {
      ...document,
      isValidated: false,
      dateValidation: null,
      dateInscription: '2026-01-01',
      validator: { id: 9 },
      files: [{ ...files[0], isPanorama: false }]
    };
    const proposed = {
      ...stored,
      files: [],
      modifiedFiles: [{ ...files[0], isPanorama: true }]
    };
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents' },
      {
        body: { documents: [stored] },
        headers: { 'Content-Range': 'documents 0-0/1' }
      }
    );
    cy.intercept({ method: 'GET', pathname: '/api/v1/documents/7' }, request =>
      request.reply(request.query.requireUpdate === 'true' ? proposed : stored)
    );
    cy.loginAs({ groups: ['User', 'Moderator'] });
    visit('/documents/validation');
    cy.contains('tr', 'Cave panorama', { timeout: 30000 }).click();
    cy.get('[data-testid="document-diff-isPanorama-10"]')
      .should('contain', '360-degree display')
      .and('contain', 'No')
      .and('contain', 'Yes');
    cy.get('[data-testid="preview-edit"]').click();
    cy.contains('[role="dialog"]', 'Edit document').within(() => {
      cy.get('[data-testid="panorama-display-toggle"]').click();
      cy.get('[data-testid="panorama-display-checkbox"]')
        .should('be.checked')
        .uncheck();
      submit();
    });
    cy.wait('@update').then(({ request }) => {
      expectValue(request.body, 'modifiedFiles[0][id]', '10');
      expectValue(request.body, 'modifiedFiles[0][isPanorama]', 'false');
    });
  });
});
