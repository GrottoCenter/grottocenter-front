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
    .get('[data-testid="file-dropzone"]')
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
    cy.intercept('GET', '**/api/v1/languages*', {
      body: { languages: [{ id: 'eng', part1: 'en', refName: 'English' }] }
    });
    cy.intercept('GET', '**/api/v1/documents/types*', {
      body: { documentTypes: [{ id: 3, name: 'Issue' }] }
    });
    cy.intercept('GET', '**/api/v1/file-formats', {
      body: { fileFormats: [{ mimeType: 'application/pdf', extension: 'pdf' }] }
    }).as('formats');
    cy.intercept('GET', '**/api/v1/documents/subjects', {
      body: { subjects: [] }
    });
    cy.intercept('GET', '**/api/v1/documents/identifierTypes', {
      body: { identifierTypes: [] }
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
    cy.get('[data-testid="publication-authorization"]')
      .should('be.checked')
      .and('be.disabled');
    cy.wait('@licenses');
    cy.get('[data-testid="document-submit"]').should('be.enabled').click();
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
    cy.get('[data-testid="document-parent-search"]').clear();
    cy.get('[data-testid="document-parent-search"]').type('Test coll');
    cy.wait('@search');
    cy.contains('[role="option"]', 'Test collection').click();
    cy.wait('@parent');
    addFile();
    cy.get('[data-testid="publication-authorization"]')
      .should('be.checked')
      .and('be.disabled');
    cy.get('[data-testid="document-submit"]').should('be.enabled').click();
    cy.wait('@save').then(({ request }) => {
      expectMultipartValue(request.body, 'license[id]', '2');
      expectMultipartValue(request.body, 'authorizationDocument[id]', '99');
    });
  });

  [
    [1280, 720, 'desktop'],
    [390, 667, 'mobile']
  ].forEach(([width, height, viewport]) => {
    ['Article', 'Issue'].forEach(type => {
      it(`uses a compact ${type} parent selector with type icons on ${viewport}`, () => {
        cy.viewport(width, height);
        cy.intercept('GET', '**/api/v1/licenses', { body: { licenses } });
        const parentType = type === 'Article' ? 'Issue' : 'Collection';
        const icon = type === 'Article' ? 'NewspaperIcon' : 'BookmarksIcon';
        const parent = {
          ...collection,
          id: 44,
          type: parentType,
          title: `Test parent ${parentType}`,
          mainLanguage: 'eng',
          editor: { id: 50, name: 'Inherited publisher' },
          library: { id: 51, name: 'Inherited library' }
        };
        cy.intercept('GET', '**/api/v1/documents/42', {
          body: { ...document, type, parent: null, authorizationDocument: null }
        });
        cy.intercept('GET', '**/api/v1/documents/44', { body: parent }).as(
          'newParent'
        );
        cy.intercept('POST', '**/api/v1/search', request => {
          expect(request.body.filter).to.deep.equal({ type: parentType });
          request.reply({
            body: {
              results: [
                { ...parent, _type: 'documents' },
                {
                  ...parent,
                  id: '42',
                  title: 'Self parent must be excluded',
                  _type: 'documents'
                }
              ]
            }
          });
        }).as('parentSearch');
        cy.visit('/documents/42/edit', {
          onBeforeLoad: win =>
            win.localStorage.setItem('selectedLanguage', 'en')
        });
        cy.get('[data-testid="document-parent"]', { timeout: 30000 })
          .find('input')
          .should('have.length', 1);
        cy.get('[data-testid="document-parent-search"]').type('Test parent');
        cy.wait('@parentSearch');
        cy.contains('[role="option"]', parent.title).as('parentOption');
        cy.get('@parentOption').should('not.contain.text', `[${parentType}]`);
        cy.get('@parentOption')
          .find(`[data-testid="${icon}"]`)
          .should($icon => {
            expect($icon[0].getBoundingClientRect().width).to.be.closeTo(30, 1);
          });
        cy.contains('[role="option"]', 'Self parent must be excluded').should(
          'not.exist'
        );
        cy.get('@parentOption').click();
        cy.wait('@newParent');
        cy.get('[data-testid="document-parent-search"]').should(
          'have.value',
          parent.title
        );
        cy.get('[data-testid="document-parent"]')
          .find(`[data-testid="${icon}"]`)
          .should('exist');
        cy.get('[data-testid="document-advanced-metadata"]')
          .contains('button', 'Advanced metadata')
          .click({ scrollBehavior: 'center' });
        cy.get('[data-testid="document-editor"] input[role="combobox"]').should(
          'have.value',
          'Inherited publisher'
        );
        cy.get(
          '[data-testid="document-library"] input[role="combobox"]'
        ).should('have.value', 'Inherited library');
        cy.get('[data-testid="document-editor"] input[role="combobox"]').then(
          $editor => {
            const editorHeight =
              $editor[0].parentElement.getBoundingClientRect().height;
            cy.get('[data-testid="document-parent-search"]').should($input => {
              const root = $input[0].parentElement;
              const input = $input[0].getBoundingClientRect();
              const selectedIcon = root
                .querySelector('svg')
                .getBoundingClientRect();
              expect(root.getBoundingClientRect().height).to.be.closeTo(
                editorHeight,
                1
              );
              expect(selectedIcon.top + selectedIcon.height / 2).to.be.closeTo(
                input.top + input.height / 2,
                1
              );
            });
          }
        );
        cy.get('[data-testid="document-parent"]').scrollIntoView();
        cy.get('[data-testid="document-parent"]').screenshot(
          `compact-parent-${type}-${viewport}`
        );
        cy.get('[data-testid="document-parent-search"]').focus();
        cy.get(
          '[data-testid="document-parent"] button[aria-label="Clear"]'
        ).click();
        cy.get('[data-testid="document-parent-search"]').should(
          'have.value',
          ''
        );
        cy.get('[data-testid="document-parent"]')
          .find(`[data-testid="${icon}"]`)
          .should('not.exist');
      });
    });
  });

  it('allows correcting an unknown license inherited when selecting a parent', () => {
    cy.intercept('GET', '**/api/v1/licenses', { body: { licenses } });
    cy.intercept('GET', '**/api/v1/documents/41', {
      body: { ...collection, license: 'Historical license' }
    }).as('unknownParent');
    cy.intercept('POST', '**/api/v1/search', {
      body: { results: [{ ...collection, _type: 'documents' }] }
    }).as('search');
    cy.visit('/documents/42/edit', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.wait('@formats');
    cy.get('[data-testid="document-parent-search"]').clear();
    cy.get('[data-testid="document-parent-search"]').type('Test coll');
    cy.wait('@search');
    cy.contains('[role="option"]', 'Test collection').click();
    cy.wait('@unknownParent');
    addFile();
    cy.get('[data-testid="publication-authorization"]')
      .should('be.checked')
      .and('be.disabled');
    cy.get('[data-testid="document-submit"]').should('be.disabled');
    cy.get('[data-testid="document-license"]')
      .should('contain', 'Historical license')
      .click();
    cy.get('[data-testid="document-license-option-2"]').click();
    cy.get('[data-testid="document-license"]')
      .find('[role="combobox"]')
      .should('not.have.attr', 'aria-disabled', 'true')
      .and('not.have.attr', 'aria-describedby');
    cy.get('[data-testid="document-license"]')
      .find('[role="combobox"]')
      .click();
    cy.get('[data-testid="document-license-option-1"]').click();
    cy.get('[data-testid="document-submit"]').should('be.enabled').click();
    cy.wait('@save').then(({ request }) => {
      expectMultipartValue(request.body, 'license[id]', '1');
      expectMultipartValue(request.body, 'authorizationDocument[id]', '99');
    });
  });
});
