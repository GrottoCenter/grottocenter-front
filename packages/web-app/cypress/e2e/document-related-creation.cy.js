import { AUTOCOMPLETE_DEBOUNCE_DELAY } from '../../src/conf/config';

const document = {
  id: 7,
  type: 'Issue',
  title: 'Document in progress',
  description: 'Description retained',
  isValidated: true,
  isDeleted: false,
  mainLanguage: 'eng',
  authors: [{ id: 1, nickname: 'Existing author' }],
  authorsOrganization: [],
  files: [
    {
      id: 9,
      fileName: 'kept.pdf',
      completePath: 'https://documents.example.org/kept.pdf'
    }
  ],
  parent: { id: 8, type: 'Collection', title: 'Parent collection' }
};

const openOrganization = (context, query) => {
  cy.get(`[data-testid="document-${context}"] input[role="combobox"]`).type(
    query
  );
  cy.get(`[data-testid="create-${context}-search-button"]`).click();
  cy.get('[data-testid="related-entity-dialog"]').should('be.visible');
};

const checkAuthorsFieldWidth = () => {
  cy.get('[data-testid="document-authors"]').should($authors => {
    const wrapper = $authors[0];
    const field = wrapper.querySelector('input[role="combobox"]').parentElement;
    expect(field.getBoundingClientRect().width).to.be.closeTo(
      wrapper.getBoundingClientRect().width,
      1
    );
  });
};

describe('Create related entities without leaving a document', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept('GET', '**/api/v1/documents/7', { body: document });
    cy.intercept('GET', '**/api/v1/documents/types*', {
      body: { documentTypes: [{ id: 1, name: 'Issue' }] }
    });
    cy.intercept('GET', '**/api/v1/languages*', {
      body: { languages: [{ id: 'eng', part1: 'en', refName: 'English' }] }
    });
    cy.intercept('GET', '**/api/v1/licenses', { body: { licenses: [] } });
    cy.intercept('GET', '**/api/v1/documents/identifierTypes', {
      body: { identifierTypes: [] }
    });
    cy.intercept('GET', '**/api/v1/documents/subjects', {
      body: { subjects: [] }
    });
    cy.intercept('GET', '**/api/v1/file-formats', {
      body: { fileFormats: [{ extension: 'pdf', mimeType: 'application/pdf' }] }
    });
    cy.intercept('POST', '**/api/v1/search', { body: { results: [] } });
    cy.intercept('POST', '**/api/v1/organizations', request =>
      request.reply({
        body: { id: 42, name: request.body.name.text, type: request.body.type }
      })
    ).as('createOrganization');
    cy.intercept('POST', '**/api/v1/cavers', {
      body: { id: 43, nickname: 'Jane Doe', type: 'AUTHOR' }
    }).as('createAuthor');
    cy.intercept('PUT', '**/api/v1/documents/7', { body: { id: 7 } }).as(
      'saveDocument'
    );
    cy.loginAs();
  });

  [
    [1280, 720, 'desktop'],
    [390, 667, 'mobile']
  ].forEach(([width, height, viewport]) => {
    it(`offers creation after a two-character selection search on ${viewport}`, () => {
      cy.viewport(width, height);
      cy.intercept('POST', '**/api/v1/search', request => {
        const isAuthorSearch = request.body.entities.includes('persons');
        request.reply({
          delay: 500,
          body: {
            results: [
              {
                id: 88,
                name: request.body.query,
                nickname: request.body.query,
                _type: isAuthorSearch ? 'persons' : 'organizations',
                type: isAuthorSearch ? 'AUTHOR' : 'OTHER'
              }
            ]
          }
        });
      }).as('selectionSearch');
      cy.visit('/documents/7/edit', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
      });
      cy.get('[data-testid="document-advanced-metadata"]', { timeout: 30000 })
        .contains('button', 'Advanced metadata')
        .click({ scrollBehavior: 'center' });

      [
        ['authors', 'Li', 'create-author-search-button'],
        ['editor', 'AB', 'create-editor-search-button'],
        ['library', 'CD', 'create-library-search-button']
      ].forEach(([context, query, testId], index) => {
        const input = `[data-testid="document-${context}"] input[role="combobox"]`;
        cy.get(input).click();
        cy.get(`[data-testid="${testId}"]`).should('not.exist');
        cy.contains('Type at least 2 character(s)').should('be.visible');
        cy.get(input).type(' L ');
        // Verify no request starts once the one-letter debounce has elapsed.
        cy.wait(AUTOCOMPLETE_DEBOUNCE_DELAY + 50);
        cy.get('@selectionSearch.all').should('have.length', index);
        cy.get(`[data-testid="${testId}"]`).should('not.exist');
        cy.get(input).clear();
        cy.get(input).type(` ${query} `);
        cy.get(`[data-testid="${testId}"]`).should('not.exist');
        cy.wait('@selectionSearch')
          .its('request.body.query')
          .should('eq', query);
        cy.contains('[role="option"]', query).should('be.visible');
        cy.get(`[data-testid="${testId}"]`).should('be.visible');
        if (context === 'authors') {
          cy.get(
            '[data-testid="create-author-organization-search-button"]'
          ).should('be.visible');
        }
        cy.get(input).clear();
        cy.get(input).type(' L ');
        cy.get(`[data-testid="${testId}"]`).should('not.exist');
      });
      cy.get('@createOrganization.all').should('have.length', 0);
      cy.get('@createAuthor.all').should('have.length', 0);
      cy.get('@saveDocument.all').should('have.length', 0);
    });

    it(`creates a publisher and a library with optional country on ${viewport}`, () => {
      cy.viewport(width, height);
      cy.visit('/documents/7/edit', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
      });
      cy.get('[data-testid="document-advanced-metadata"]', { timeout: 30000 })
        .contains('button', 'Advanced metadata')
        .scrollIntoView();
      cy.get('[data-testid="document-advanced-metadata"]', { timeout: 30000 })
        .contains('button', 'Advanced metadata')
        .click({ scrollBehavior: 'center' });
      cy.contains('span', 'Code for designating a document').then($help => {
        cy.contains(
          'span',
          'The publisher is the organization that publishes the document.'
        ).should('have.css', 'color', $help.css('color'));
      });
      ['editor', 'library'].forEach(context => {
        cy.get(
          `[data-testid="document-${context}"] input[role="combobox"]`
        ).scrollIntoView();
        cy.get(
          `[data-testid="document-${context}"] input[role="combobox"]`
        ).type(`New ${context}`);
        cy.get(
          `[data-testid="document-${context}"] input[role="combobox"]`
        ).should('have.value', `New ${context}`);
        cy.get(`[data-testid="create-${context}-search-button"]`).click();
        cy.get('[data-testid="organization-name"] input').should(
          'have.value',
          `New ${context}`
        );
        cy.get('[data-testid="related-entity-dialog"]').within(() => {
          cy.get('input[name^="organization."]').should('have.length', 5);
          cy.get('[name="organization.mail"]').should('not.exist');
          cy.get('[data-testid="entity-name-suggestions"]').should('not.exist');
        });
        cy.get('[data-testid="organization-type-field"] input').should(
          'have.value',
          context === 'editor' ? 'EDITION' : 'LIBRARY'
        );
        if (viewport === 'mobile') {
          cy.get('[data-testid="related-entity-dialog"]').should(([dialog]) => {
            expect(dialog.getBoundingClientRect().width).to.be.closeTo(
              width,
              1
            );
            expect(dialog.getBoundingClientRect().height).to.be.closeTo(
              height,
              1
            );
          });
        }
        cy.get(
          '[data-testid="organization-type-field"] [role="combobox"]'
        ).click();
        cy.get('[data-testid="type-SPELEOLOGY"]').click();
        if (context === 'editor') {
          cy.get('[data-testid="related-entity-dialog"]').screenshot(
            `organization-creation-${viewport}`
          );
        }
        cy.get('[data-testid="create-related-entity"]').click();
        cy.wait('@createOrganization').then(({ request }) => {
          expect(request.body.country).to.deep.equal({ id: null });
          expect(request.body.type).to.equal('SPELEOLOGY');
        });
        cy.get('[data-testid="related-entity-dialog"]').should('not.exist');
        cy.get(`[data-testid="document-${context}"] input[role="combobox"]`)
          .should('have.value', `New ${context}`)
          .and('have.focus');
      });
      cy.get('[data-testid="document-authors"]').should(
        'contain.text',
        'Existing author'
      );
      cy.get('[data-testid="selected-files"]').should(
        'contain.text',
        'kept.pdf'
      );
      cy.get('@saveDocument.all').should('have.length', 0);
      cy.url().should('include', '/documents/7/edit');
    });

    it(`validates and creates an author via the keyboard on ${viewport}`, () => {
      cy.viewport(width, height);
      cy.intercept('POST', '**/api/v1/search', request => {
        if (request.body.query === 'Jane Doe') request.alias = 'authorSearch';
        request.reply({ body: { results: [] } });
      });
      cy.visit('/documents/7/edit', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
      });
      // The native file input is intentionally hidden behind the file picker.
      if (viewport === 'mobile') {
        cy.get('[data-testid="file-picker"]', { timeout: 30000 }).should(
          'be.enabled'
        );
      } else {
        cy.get('[data-testid="file-dropzone"]', { timeout: 30000 }).should(
          'have.attr',
          'aria-disabled',
          'false'
        );
      }
      cy.get('input[type="file"]', { timeout: 30000 }).selectFile(
        {
          contents: Cypress.Buffer.from('%PDF-1.4\n'),
          fileName: 'draft.pdf',
          mimeType: 'application/pdf'
        },
        { force: true }
      );
      cy.get('[data-testid="selected-files"]').should(
        'contain.text',
        'draft.pdf'
      );
      cy.get('[data-testid="document-authors"]').within(() => {
        cy.contains('button', /^Create/).should('not.exist');
      });
      checkAuthorsFieldWidth();
      cy.get('[data-testid="document-authors"] input', { timeout: 30000 }).type(
        'Jane Doe'
      );
      cy.wait('@authorSearch');
      cy.get('[role="listbox"]').should($list => {
        const bounds = $list[0].getBoundingClientRect();
        expect(bounds.left).to.be.at.least(0);
        expect(bounds.right).to.be.at.most(width);
      });
      cy.get('[data-testid="create-author-search-button"]')
        .find('svg')
        .should('exist');
      cy.get('[data-testid="create-author-organization-search-button"]')
        .find('svg')
        .should('exist');
      cy.screenshot(`author-creation-options-${viewport}`);
      cy.get('[data-testid="document-authors"]').then($authors => {
        const fieldTop = $authors[0].getBoundingClientRect().top;
        cy.get('[data-testid="document-authors"] input').type(
          '{downarrow}{enter}',
          { scrollBehavior: false }
        );
        cy.get('[data-testid="related-entity-dialog"] [name="name"]').should(
          'have.focus'
        );
        cy.get('[data-testid="document-authors"]').should($field => {
          expect($field[0].getBoundingClientRect().top).to.be.closeTo(
            fieldTop,
            1
          );
        });
      });
      cy.get('[data-testid="related-entity-dialog"]').within(() => {
        cy.contains('Searched name: Jane Doe').should('be.visible');
        cy.get('[name="name"]').should('have.value', '');
        cy.get('[name="surname"]').should('have.value', '');
        cy.get('[data-testid="create-related-entity"]').click();
        cy.get('[name="name"]').should('have.focus').type('Jane');
        cy.get('[name="surname"]').type('Doe{enter}');
      });
      cy.wait('@createAuthor')
        .its('request.body')
        .should('deep.equal', { name: 'Jane', surname: 'Doe' });
      cy.get('[data-testid="document-authors"]')
        .should('contain.text', 'Jane Doe')
        .and('contain.text', 'Existing author');
      checkAuthorsFieldWidth();
      cy.get('[data-testid="document-authors"] input').should('have.focus');
      cy.get('[data-testid="selected-files"]').should(
        'contain.text',
        'draft.pdf'
      );
      cy.get('@saveDocument.all').should('have.length', 0);
    });

    it(`keeps both creation actions visible while scrolling a long list on ${viewport}`, () => {
      cy.viewport(width, height);
      cy.intercept('POST', '**/api/v1/search', {
        body: {
          results: Array.from({ length: 30 }, (_value, index) => ({
            id: index + 100,
            nickname: `Existing author ${index + 1}`,
            _type: 'persons',
            type: 'AUTHOR'
          }))
        }
      }).as('authorResults');
      cy.visit('/documents/7/edit', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
      });
      cy.get('[data-testid="document-authors"] input', { timeout: 30000 }).type(
        'Existing'
      );
      cy.wait('@authorResults');
      cy.contains('[role="option"]', 'Existing author 30').should('exist');
      const checkCreationActions = () => {
        cy.get('[role="listbox"]').then($list => {
          const list = $list[0].getBoundingClientRect();
          expect($list[0].scrollHeight).to.be.greaterThan(
            $list[0].clientHeight
          );
          [
            'create-author-search-button',
            'create-author-organization-search-button'
          ].forEach(testId => {
            cy.get(`[data-testid="${testId}"]`).should($action => {
              const bounds = $action[0].getBoundingClientRect();
              expect(bounds.top).to.be.at.least(list.top);
              expect(bounds.bottom).to.be.at.most(list.bottom);
              if (testId === 'create-author-organization-search-button') {
                expect(bounds.bottom).to.be.closeTo(list.bottom, 1);
              }
            });
          });
        });
      };
      checkCreationActions();
      cy.get('[data-testid="document-authors"] input').type(
        '{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}'
      );
      cy.get('[data-testid="document-authors"] input').should($input => {
        const option = $input[0].ownerDocument.getElementById(
          $input.attr('aria-activedescendant')
        );
        const actions = option
          .closest('[role="listbox"]')
          .querySelector('[data-creation-actions]');
        expect(option.getBoundingClientRect().bottom).to.be.at.most(
          actions.getBoundingClientRect().top
        );
      });
      cy.get('[role="listbox"]').scrollTo('bottom');
      checkCreationActions();
      cy.get('[role="listbox"]').scrollTo('top');
      checkCreationActions();
      cy.get('[role="listbox"]').screenshot(
        `creation-actions-long-list-${viewport}`
      );
      cy.get('[data-testid="create-author-organization-search-button"]')
        .find('img')
        .should('have.attr', 'width', '30');
      cy.get('[data-testid="create-author-organization-search-button"]').click({
        scrollBehavior: false
      });
      cy.get('[data-testid="organization-name"] input').should(
        'have.value',
        'Existing'
      );
      cy.get('@createOrganization.all').should('have.length', 0);
      cy.get('@saveDocument.all').should('have.length', 0);
    });
  });

  it('selects an existing organization directly from the field search', () => {
    cy.viewport(1280, 900);
    cy.intercept('POST', '**/api/v1/search', {
      body: {
        results: [
          {
            id: 88,
            _type: 'organizations',
            name: 'Existing organization',
            type: 'OTHER'
          }
        ]
      }
    });
    cy.visit('/documents/7/edit', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.get('[data-testid="document-advanced-metadata"]', { timeout: 30000 })
      .contains('button', 'Advanced metadata')
      .click({ scrollBehavior: 'center' });
    cy.get('[data-testid="document-editor"] input[role="combobox"]').type(
      'Existing organization'
    );
    cy.get('[data-testid="document-editor"] input[role="combobox"]').then(
      $input => {
        cy.wrap($input[0].parentElement.getBoundingClientRect().height).as(
          'editorFieldHeight'
        );
      }
    );
    cy.contains('[role="option"]', 'Existing organization').click();
    cy.get('[data-testid="document-editor"] input[role="combobox"]').should(
      'have.value',
      'Existing organization'
    );
    cy.get('@editorFieldHeight').then(initialHeight => {
      cy.get('[data-testid="document-editor"] input[role="combobox"]').should(
        $input => {
          const root = $input[0].parentElement;
          const input = $input[0].getBoundingClientRect();
          const icon = root.querySelector('img').getBoundingClientRect();
          expect(root.getBoundingClientRect().height).to.be.closeTo(
            initialHeight,
            1
          );
          expect(icon.top + icon.height / 2).to.be.closeTo(
            input.top + input.height / 2,
            1
          );
        }
      );
    });
    cy.get('[data-testid="document-editor"]').screenshot(
      'selected-organization-field'
    );
    cy.get(
      '[data-testid="document-editor"] button[aria-label="Clear"]'
    ).click();
    cy.get('[data-testid="document-editor"] input[role="combobox"]').should(
      'have.value',
      ''
    );
    cy.get('[data-testid="document-editor"]').find('img').should('not.exist');
    cy.get('[data-testid="related-entity-dialog"]').should('not.exist');
    cy.get('@createOrganization.all').should('have.length', 0);
  });

  it('retains the name after rejection and cancels only the local creation', () => {
    cy.viewport(390, 844);
    cy.intercept('POST', '**/api/v1/organizations', {
      statusCode: 500,
      body: { message: 'Private server detail' }
    }).as('rejectedOrganization');
    cy.visit('/documents/7/edit', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.get('[data-testid="document-advanced-metadata"]', { timeout: 30000 })
      .contains('button', 'Advanced metadata')
      .scrollIntoView();
    cy.get('[data-testid="document-advanced-metadata"]', { timeout: 30000 })
      .contains('button', 'Advanced metadata')
      .click({ scrollBehavior: 'center' });
    openOrganization('editor', 'Keep this name');
    cy.get('[data-testid="create-related-entity"]').click();
    cy.wait('@rejectedOrganization');
    cy.get('[data-testid="organization-name"] input').should(
      'have.value',
      'Keep this name'
    );
    cy.get('[data-testid="related-entity-dialog"]')
      .contains('button', /^Cancel$/)
      .click();
    cy.get('[data-testid="related-entity-dialog"]').should('not.exist');
    cy.get('[data-testid="document-editor"] input[role="combobox"]').should(
      'have.focus'
    );
    cy.get('[data-testid="selected-files"]').should('contain.text', 'kept.pdf');
    cy.get('@saveDocument.all').should('have.length', 0);
  });
});
