const collection = {
  id: 10,
  title: 'Test collection',
  type: 'Collection',
  isValidated: true,
  isDeleted: false,
  files: [],
  authors: [],
  authorsOrganization: [],
  massifs: [],
  entrances: [],
  mainLanguage: 'eng'
};
const issue = { ...collection, id: 11, title: 'Test issue', type: 'Issue' };

describe('Contextual document creation', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    [collection, issue].forEach(parent => {
      cy.intercept(
        { method: 'GET', pathname: `/api/v1/documents/${parent.id}` },
        { body: parent }
      );
      cy.intercept(
        { method: 'GET', pathname: `/api/v1/documents/${parent.id}/children` },
        { body: { documents: [] } }
      );
    });
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      { body: { languages: [{ id: 'eng', part1: 'en', refName: 'English' }] } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/types' },
      {
        body: {
          documentTypes: [
            { id: 1, name: 'Collection' },
            { id: 2, name: 'Issue' },
            { id: 3, name: 'Article' }
          ]
        }
      }
    );
    // The catch-all's {} is invalid for reference queries: undefined query
    // data triggers error snackbars that can cover the mobile submit button.
    [
      ['licenses', 'licenses'],
      ['file-formats', 'fileFormats'],
      ['documents/identifierTypes', 'identifierTypes'],
      ['documents/subjects', 'subjects']
    ].forEach(([path, key]) => {
      cy.intercept(
        { method: 'GET', pathname: `/api/v1/${path}` },
        { body: { [key]: [] } }
      ).as(key);
    });
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/search' },
      {
        body: {
          results: [
            {
              id: 2,
              nickname: 'Test author',
              name: 'Test author',
              _type: 'persons',
              type: 'AUTHOR'
            }
          ]
        }
      }
    );
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/documents' },
      { body: { document: { id: 99 } } }
    ).as('createDocument');
    cy.loginAs();
  });

  [
    [collection, 'Issue', 'issue', 2, 1280],
    [issue, 'Article', 'article', 3, 390]
  ].forEach(([parent, type, label, typeId, width]) => {
    it(`creates the first ${label} from an empty section at ${width}px`, () => {
      cy.viewport(width, 900);
      cy.visit(`/documents/${parent.id}`, {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
      });
      const emptyText =
        type === 'Issue'
          ? 'No issues in this collection.'
          : 'No articles in this issue.';
      cy.contains(emptyText).should('be.visible');
      cy.get('[data-testid="create-child-document"]')
        .should('be.visible')
        .then($action => {
          const rect = $action[0].getBoundingClientRect();
          expect(rect.left).to.be.at.least(0);
          expect(rect.right).to.be.at.most(width);
          expect($action.text().trim()).to.eq(width < 900 ? '' : 'New');
        });
      cy.get('[data-testid="create-child-document"] svg').should('be.visible');
      cy.screenshot(`empty-${type.toLowerCase()}-${width}`);
      if (type === 'Article') {
        cy.get('[data-testid="create-child-document"]')
          .closest('.MuiCard-root')
          .find('.MuiIconButton-root')
          .last()
          .click();
        cy.contains(emptyText).should('not.be.visible');
      }
      cy.get('[data-testid="create-child-document"]').focus();
      cy.press(Cypress.Keyboard.Keys.ENTER);
      cy.location('search').should('eq', `?type=${type}&parentId=${parent.id}`);
      cy.contains('h1', `Add an ${label} to ${parent.title}`).should(
        'be.visible'
      );
      cy.get(`[data-testid="document-type-${typeId}"]`).should(
        'have.attr',
        'aria-pressed',
        'true'
      );
      cy.get('[data-testid="document-parent"] input').should(
        'have.value',
        parent.title
      );
      cy.wait(['@licenses', '@fileFormats', '@identifierTypes', '@subjects']);
      cy.get('[data-testid="app-snackbar"]').should('not.exist');
      cy.get('@createDocument.all').should('have.length', 0);
      cy.get('[data-testid="document-submit"]').should('be.disabled');
      cy.get('[data-testid="document-title"] input').type(`First ${label}`);
      cy.get('textarea').first().type('A new contribution');
      cy.get('[data-testid="document-authors"] input[role="combobox"]').type(
        'Test'
      );
      cy.contains('[role="option"]', 'Test author').click();
      // FixedContent scrolls smoothly. Finish scrolling before the click and
      // prevent Cypress from starting another scroll in its nested container.
      cy.get('[data-testid="document-submit"]').then(([button]) => {
        button.scrollIntoView({ behavior: 'instant', block: 'center' });
      });
      cy.get('[data-testid="document-submit"]')
        .should('be.visible')
        .click({ scrollBehavior: false });
      cy.wait('@createDocument')
        .its('request.body')
        .should('include', `First ${label}`)
        .and('include', 'name="parent[id]"')
        .and('include', `\r\n\r\n${parent.id}\r\n`)
        .and('include', `\r\n\r\n${type}\r\n`);
      cy.contains('Your document has been successfully submitted', {
        timeout: 15000
      }).should('be.visible');
      if (type === 'Article') {
        cy.contains('button', 'Add another article').click();
        cy.get('[data-testid="document-parent"] input').should(
          'have.value',
          parent.title
        );
        cy.get('[data-testid="document-title"] input').should('have.value', '');
        cy.contains('h1', `Add an article to ${parent.title}`).should(
          'be.visible'
        );
      }
    });
  });

  [320, 390, 768, 1280].forEach(width => {
    it(`keeps sorting beside New and hides it when collapsed at ${width}px`, () => {
      cy.viewport(width, 900);
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/documents/11/children' },
        {
          body: {
            documents: [
              {
                id: 20,
                title: 'First article',
                type: 'Article',
                hasFiles: true
              },
              { id: 21, title: 'Second article', type: 'Article' }
            ]
          }
        }
      );
      cy.visit('/documents/11', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
      });
      cy.get('[data-testid="create-child-document"]').scrollIntoView();
      cy.get('[data-testid="create-child-document"]').should('be.visible');
      cy.get('[role="combobox"][aria-label="Sort by"]').should('be.visible');
      cy.get('[data-testid="create-child-document"]').should($action => {
        const card = $action[0].closest('.MuiCard-root');
        const heading = card.querySelector('h2').getBoundingClientRect();
        const action = $action[0].getBoundingClientRect();
        const sort = card
          .querySelector('[role="combobox"]')
          .getBoundingClientRect();
        expect(action.top).to.be.lessThan(heading.bottom);
        expect(action.bottom).to.be.greaterThan(heading.top);
        expect(action.left).to.be.greaterThan(heading.right);
        expect(sort.top).to.be.lessThan(action.bottom);
        expect(sort.bottom).to.be.greaterThan(action.top);
        expect(sort.right).to.be.at.most(action.left);
        expect(sort.right).to.be.at.most(width);
        expect($action.text().trim()).to.eq(width < 900 ? '' : 'New');
      });
      cy.get('[data-testid="document-availability-legend"]').should(
        'be.visible'
      );
      cy.get('[role="combobox"][aria-label="Sort by"]')
        .should('be.visible')
        .then($sort => {
          expect($sort[0].getBoundingClientRect().right).to.be.at.most(width);
          expect($sort.text().trim()).to.eq(width < 900 ? '' : 'Title');
        });
      cy.get('[role="combobox"][aria-label="Sort by"]').click();
      cy.get('[role="tooltip"]').should('not.exist');
      cy.contains('[role="option"]', 'Oldest first').first().click();
      cy.get('[data-testid="document-child-row"]').should('be.visible');
      cy.screenshot(`article-controls-${width}`);
      cy.get('button[aria-label="Articles"]').click();
      cy.get('[role="combobox"][aria-label="Sort by"]').should('not.exist');
      cy.get('[data-testid="document-availability-legend"]').should(
        'not.exist'
      );
      cy.get('[data-testid="create-child-document"]').should('be.visible');
      if (width === 390) cy.screenshot('article-controls-collapsed-mobile');
      cy.get('button[aria-label="Articles"]').click();
      cy.get('[role="combobox"][aria-label="Sort by"]').should($control => {
        const description = $control[0].ownerDocument.getElementById(
          $control.attr('aria-describedby')
        );
        expect(description.textContent).to.contain('Oldest first');
      });
    });
  });

  it('hides contextual creation from anonymous readers', () => {
    cy.visit('/documents/10', {
      onBeforeLoad: win => {
        win.localStorage.removeItem('grottocenter_token');
        win.localStorage.setItem('selectedLanguage', 'en');
      }
    });
    cy.contains('No issues in this collection.').should('be.visible');
    cy.get('[data-testid="create-child-document"]').should('not.exist');
  });
});
