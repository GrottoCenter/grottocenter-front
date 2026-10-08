const visitForm = path => {
  cy.loginAs();
  cy.visit(path, {
    onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
  });
};

const correctOversizedInput = testId => {
  cy.get(`[data-testid="${testId}"] input`).type('{end}{backspace}y');
};

describe('API text length limits in entity and account forms', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      { body: { languages: [{ id: 'eng', part1: 'en', refName: 'English' }] } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/licenses' },
      { body: { licenses: [] } }
    );
  });

  it('caps massif names and explains an oversized prefilled name', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/massifs/42' },
      {
        body: {
          id: 42,
          name: 'Test massif',
          names: [{ id: 7, name: 'x'.repeat(201) }],
          language: 'eng',
          geogPolygon: JSON.stringify({
            type: 'Polygon',
            coordinates: [
              [
                [6, 45],
                [6.01, 45],
                [6.01, 45.01],
                [6, 45]
              ]
            ]
          })
        }
      }
    );
    cy.intercept(
      { method: 'PUT', pathname: '/api/v1/**' },
      {
        statusCode: 500
      }
    ).as('saveMassif');
    visitForm('/massifs/42/edit');

    cy.get('[data-testid="massif-name"]').within(() => {
      cy.get('input')
        .should('have.attr', 'maxlength', '200')
        .and('have.attr', 'aria-invalid', 'true');
      cy.contains('Maximum 200 characters (201 entered).').should('be.visible');
      cy.contains('201 / 200').should('be.visible');
    });
    cy.contains('button', 'Update').click();
    cy.get('@saveMassif.all').should('have.length', 0);

    correctOversizedInput('massif-name');
    cy.get('[data-testid="massif-name"] input')
      .should('have.value', 'x'.repeat(200))
      .and('have.attr', 'aria-invalid', 'false');
    cy.contains('200 / 200').should('be.visible');
    cy.contains('Maximum 200 characters').should('not.exist');
  });

  it('caps document titles and keeps corrected advanced metadata open', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/types' },
      { body: { documentTypes: [{ id: 1, name: 'Collection' }] } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/identifierTypes' },
      {
        body: { identifierTypes: [{ id: 'url', name: 'URL', regexp: '^.*$' }] }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/subjects' },
      { body: { subjects: [] } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/42' },
      {
        body: {
          id: 42,
          type: 'Collection',
          title: 'x'.repeat(301),
          description: 'Test collection',
          authors: [{ id: 1, nickname: 'TestCaver' }],
          authorsOrganization: [],
          identifier: 'x'.repeat(251),
          identifierType: { id: 'url', name: 'URL', regexp: '^.*$' },
          mainLanguage: 'eng',
          files: [],
          subjects: [],
          iso3166: []
        }
      }
    );
    cy.intercept(
      { method: 'PUT', pathname: '/api/v1/documents/42' },
      {
        statusCode: 500
      }
    ).as('saveDocument');
    visitForm('/documents/42/edit');

    cy.get('[data-testid="document-title"] input')
      .should('have.attr', 'maxlength', '300')
      .and('have.attr', 'aria-invalid', 'true');
    cy.contains('Maximum 300 characters (301 entered).').should('be.visible');
    cy.contains('button', 'Update').should('be.disabled');
    cy.get('@saveDocument.all').should('have.length', 0);

    correctOversizedInput('document-title');
    cy.get('[data-testid="document-title"] input').should(
      'have.value',
      'x'.repeat(300)
    );
    cy.contains('300 / 300').should('be.visible');
    cy.get('[data-testid="document-identifier"] input').scrollIntoView();
    cy.get('[data-testid="document-identifier"] input').should('be.visible');
    correctOversizedInput('document-identifier');
    cy.get('[data-testid="document-advanced-metadata"] [aria-expanded]').should(
      'have.attr',
      'aria-expanded',
      'true'
    );
    cy.get('[data-testid="document-identifier"] input').should('be.visible');
    cy.contains('button', 'Update').should('be.enabled');
  });

  it('reports both oversized account names and saves corrected boundary values', () => {
    const account = {
      id: 1,
      nickname: 'TestCaver',
      name: 'x'.repeat(37),
      surname: 'x'.repeat(33),
      mail: 'caver@example.org',
      language: 'eng'
    };
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/account' },
      { body: account }
    );
    cy.intercept({ method: 'PATCH', pathname: '/api/v1/account' }, req => {
      if (Object.hasOwn(req.body, 'nickname')) req.alias = 'saveAccount';
      Object.assign(account, req.body);
      req.reply({ body: account });
    }).as('accountUpdate');
    visitForm('/account');
    cy.contains('Personal information')
      .parent()
      .parent()
      .contains('button', 'Edit')
      .click();

    cy.get('[data-testid="account-nickname"] input').should(
      'have.attr',
      'maxlength',
      '68'
    );
    cy.get('[data-testid="account-first-name"]').within(() => {
      cy.get('input').should('have.attr', 'maxlength', '36');
      cy.contains('Maximum 36 characters (37 entered).').should('be.visible');
    });
    cy.get('[data-testid="account-last-name"]').within(() => {
      cy.get('input').should('have.attr', 'maxlength', '32');
      cy.contains('Maximum 32 characters (33 entered).').should('be.visible');
    });
    cy.contains('button', 'Save changes').click();
    cy.get('@accountUpdate.all').should(requests => {
      expect(
        requests.filter(request =>
          Object.hasOwn(request.request.body, 'nickname')
        )
      ).to.have.length(0);
    });

    correctOversizedInput('account-first-name');
    cy.get('[data-testid="account-first-name"] input').should(
      'have.value',
      'x'.repeat(36)
    );
    correctOversizedInput('account-last-name');
    cy.get('[data-testid="account-last-name"] input').should(
      'have.value',
      'x'.repeat(32)
    );
    cy.contains('button', 'Save changes').click();
    cy.wait('@saveAccount')
      .its('request.body')
      .should('deep.equal', {
        nickname: 'TestCaver',
        name: 'x'.repeat(36),
        surname: 'x'.repeat(32)
      });
  });
});
