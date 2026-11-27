const authorizationOption = 'Authorization present in Grottocenter';
const permission = {
  id: 99,
  type: 'Authorization To Publish',
  title: 'Publication permission',
  isValidated: true,
  license: 'CC-BY'
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
  { id: 2, name: 'CC-BY', url: 'https://creativecommons.org/licenses/by/4.0/' }
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

const mockParentSearch = () =>
  cy.intercept('POST', '**/api/v1/search', request => {
    if (request.body.query === 'Test coll') request.alias = 'parentSearch';
    request.reply({
      body: { results: [{ ...collection, _type: 'documents' }] }
    });
  });

const mockAuthorizationSearch = () =>
  cy.intercept('POST', '**/api/v1/search', request => {
    const matches = request.body.query === 'Publication';
    if (matches) request.alias = 'authorizationSearch';
    request.reply({
      body: {
        results: matches ? [{ ...permission, id: String(permission.id) }] : []
      }
    });
  });

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
    cy.intercept('GET', '**/api/v1/documents/99', { body: permission }).as(
      'grant'
    );
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

  it('saves the file and granted license without reselecting the parent', () => {
    cy.intercept('GET', '**/api/v1/licenses', { body: { licenses } }).as(
      'licenses'
    );
    cy.visit('/documents/42/edit', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.wait('@formats');
    addFile();
    cy.get('[data-testid="selected-file-issue.pdf"]').should('be.visible');
    cy.get('[data-testid="document-sharing-basis"] [role="combobox"]')
      .should('contain.text', 'Publication authorization on Grottocenter')
      .and('not.have.attr', 'aria-disabled', 'true');
    cy.get('[data-testid="document-inherited-sharing"]').should('not.exist');
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

  it('associates optional collection rights without offering files or author declarations', () => {
    cy.intercept('GET', '**/api/v1/licenses', { body: { licenses } });
    mockAuthorizationSearch();
    cy.intercept('GET', '**/api/v1/documents/types*', {
      body: {
        documentTypes: [
          { id: 4, name: 'Collection' },
          { id: 5, name: 'Image' }
        ]
      }
    });
    cy.intercept('GET', '**/api/v1/documents/42', {
      body: {
        ...document,
        type: 'Collection',
        parent: null,
        license: null,
        authorizationDocument: null
      }
    });
    cy.visit('/documents/42/edit', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.get('[data-testid="document-type-5"]').click();
    cy.get('[data-testid="file-dropzone"]').should(
      'have.attr',
      'aria-disabled',
      'false'
    );
    cy.get('[data-testid="document-type-4"]').click();
    cy.get('[data-testid="file-dropzone"]').should('not.exist');
    cy.get('[data-testid="publication-author-rights"]').should('not.exist');
    cy.get('[data-testid="publication-authorization"]').should('not.exist');
    cy.get('[data-testid="document-submit"]').should('be.enabled');
    cy.get('[data-testid="document-description"]').should($description => {
      const advanced = $description[0].ownerDocument.querySelector(
        '[data-testid="document-advanced-metadata"]'
      );
      expect($description[0].compareDocumentPosition(advanced)).to.equal(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    });
    cy.get('[data-testid="collection-publication-rights"]').should(
      'be.visible'
    );
    cy.get('[data-testid="document-advanced-metadata"] button')
      .first()
      .should('have.attr', 'aria-expanded', 'false');
    cy.get('[data-testid="document-authors"] input[role="combobox"]').should(
      'not.have.attr',
      'required'
    );
    cy.get('[data-testid="authorization-document-search"]').should(
      'not.have.attr',
      'required'
    );
    cy.get('[data-testid="authorization-document-search"]').type('Publication');
    cy.wait('@authorizationSearch')
      .its('request.body')
      .should('deep.equal', {
        entities: ['documents'],
        query: 'Publication',
        filter: { type: ['Authorization To Publish'] }
      });
    cy.contains('[role="option"]', permission.title)
      .find('[data-testid="authorization-type-icon"]')
      .should('be.visible');
    cy.contains('[role="option"]', permission.title).click();
    cy.get('[data-testid="collection-publication-rights"]')
      .find('[data-testid="authorization-type-icon"]')
      .should('be.visible');
    cy.wait('@grant');
    cy.get('[data-testid="authorization-granted-license"]')
      .find('img[alt="CC-BY"]')
      .should('be.visible');
    cy.get('[data-testid="document-license"]').should('not.exist');
    cy.get('[data-testid="document-submit"]').should('be.enabled').click();
    cy.wait('@save').then(({ request }) => {
      expectMultipartValue(request.body, 'license[id]', '2');
      expectMultipartValue(request.body, 'authorizationDocument[id]', '99');
      expectMultipartValue(request.body, 'option', authorizationOption);
      expect(request.body).not.to.include('name="files"');
      expect(request.body).not.to.include('filename=');
    });
  });

  it('preserves the document?s own rights when a parent is reselected', () => {
    cy.intercept('GET', '**/api/v1/licenses', { body: { licenses } });
    mockParentSearch();
    cy.visit('/documents/42/edit', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.wait('@formats');
    cy.get('[data-testid="document-parent-search"]').clear();
    cy.get('[data-testid="document-parent-search"]').type('Test coll');
    cy.wait('@parentSearch');
    cy.contains('[role="option"]', 'Test collection').click();
    cy.wait('@parent');
    addFile();
    cy.get('[data-testid="document-sharing-basis"] [role="combobox"]')
      .should('contain.text', 'Publication authorization on Grottocenter')
      .and('not.have.attr', 'aria-disabled', 'true');
    cy.get('[data-testid="document-inherited-sharing"]').should('not.exist');
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
        const icon = '[data-testid="document-type-icon"]';
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
          .find(icon)
          .should($icon => {
            expect($icon[0].getBoundingClientRect().width).to.be.closeTo(30, 1);
          })
          .find('path')
          .invoke('attr', 'd')
          .as('parentIconPath', { type: 'static' });
        cy.contains('[role="option"]', 'Self parent must be excluded').should(
          'not.exist'
        );
        cy.get('@parentOption').click();
        cy.wait('@newParent');
        cy.get('[data-testid="document-parent-search"]').should(
          'have.value',
          parent.title
        );
        cy.get('@parentIconPath').then(path => {
          cy.get('[data-testid="document-parent"]')
            .find(`${icon} path`)
            .should('have.attr', 'd', path);
        });
        cy.get('[data-testid="document-advanced-metadata"]')
          .contains('button', 'Advanced metadata')
          .click({ scrollBehavior: 'center' });
        cy.get('[data-testid="document-editor"] input[role="combobox"]').should(
          'have.value',
          ''
        );
        cy.get(
          '[data-testid="document-library"] input[role="combobox"]'
        ).should('have.value', '');
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
          .find(icon)
          .should('not.exist');
      });
    });
  });

  it('refreshes the license from the authorization on mobile', () => {
    cy.viewport(390, 667);
    cy.intercept('GET', '**/api/v1/licenses', { body: { licenses } });
    cy.intercept('GET', '**/api/v1/documents/99', {
      body: { ...permission, license: 'CC-BY-SA' }
    }).as('updatedGrant');
    cy.visit('/documents/42/edit', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.wait('@updatedGrant');
    cy.get('[data-testid="authorization-granted-license"]').scrollIntoView();
    cy.get('[data-testid="authorization-granted-license"]')
      .find('img[alt="CC-BY-SA"]')
      .should('be.visible');
    cy.get('[data-testid="document-license"]').should('not.exist');
    cy.get('[data-testid="document-submit"]').should('be.enabled').click();
    cy.wait('@save').then(({ request }) => {
      expectMultipartValue(request.body, 'license[id]', '1');
      expectMultipartValue(request.body, 'authorizationDocument[id]', '99');
    });
  });

  it('shows the scope before the granted license and marks the external link', () => {
    cy.intercept('GET', '**/api/v1/licenses', { body: { licenses } });
    cy.intercept('GET', '**/api/v1/documents/types*', {
      body: { documentTypes: [{ id: 20, name: 'Authorization To Publish' }] }
    });
    cy.intercept('GET', '**/api/v1/documents/42', {
      body: {
        ...document,
        type: permission.type,
        parent: null,
        authorizationDocument: null,
        license: null
      }
    });
    cy.visit('/documents/42/edit', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.get('[data-testid="document-submit"]').should('be.disabled');
    cy.get('[data-testid="document-license"] [role="combobox"]').should(
      $select => {
        const guidance = $select[0].ownerDocument.getElementById(
          $select.attr('aria-describedby')
        );
        expect(guidance.textContent).to.include(
          'documents covered by this publication authorization'
        );
        expect(guidance.compareDocumentPosition($select[0])).to.equal(
          Node.DOCUMENT_POSITION_FOLLOWING
        );
      }
    );
    cy.get('[data-testid="document-license"] [role="combobox"]').click();
    cy.get('[data-testid="document-license-option-2"]').click();
    cy.contains('a', 'See the full license').as('licenseDeed');
    cy.get('@licenseDeed').should('have.attr', 'target', '_blank');
    cy.get('@licenseDeed')
      .find('[data-testid="OpenInNewIcon"]')
      .should('be.visible');
    cy.get('[data-testid="document-submit"]').should('be.enabled').click();
    cy.contains('[role="dialog"] button', 'Submit anyway').click();
    cy.wait('@save').then(({ request }) => {
      expectMultipartValue(request.body, 'license[id]', '2');
      expect(request.body).not.to.include('name="authorizationDocument[id]"');
      expect(request.body).not.to.include('name="option"');
    });
  });
});
