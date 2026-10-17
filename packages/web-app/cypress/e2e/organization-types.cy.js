const visitForm = path => {
  cy.loginAs();
  cy.visit(path, {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', 'en');
    }
  });
};

const selectType = type => {
  cy.get('[data-testid="organization-type-field"] [role="combobox"]').click();
  cy.get(`[data-testid="type-${type}"]`).click();
};

describe('Required organization classification', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      {
        body: {
          languages: [
            { id: 'eng', part1: 'en', refName: 'English' },
            { id: 'fra', part1: 'fr', refName: 'French' }
          ]
        }
      }
    );
  });

  it('requires a type on creation and preserves values after API rejection', () => {
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/organizations' },
      {
        statusCode: 400,
        body: { code: 'organizationType.required', message: 'Type is required' }
      }
    ).as('createOrganization');
    visitForm('/entity/add/organization');
    cy.get('[data-testid="organization-name"] input').type('New organization');
    cy.get('[name="organization.customMessage"]').type('Test description');
    cy.contains('button', 'Create').click();
    cy.contains('Choose an organization type.').should('be.visible');
    cy.get('[data-testid="organization-type-field"] [role="combobox"]').should(
      'have.focus'
    );
    cy.get('@createOrganization.all').should('have.length', 0);

    selectType('RESEARCH');
    cy.contains('button', 'Create').click();
    cy.wait('@createOrganization')
      .its('request.body.type')
      .should('eq', 'RESEARCH');
    cy.get('[data-testid="organization-name"] input').should(
      'have.value',
      'New organization'
    );
    cy.get('[data-testid="organization-type-field"] [role="combobox"]').should(
      'contain',
      'Research organization'
    );

    selectType('LIBRARY');
    cy.contains('button', 'Create').click();
    cy.wait('@createOrganization')
      .its('request.body.type')
      .should('eq', 'LIBRARY');
  });

  it('requires classification when editing an old organization, before updating its name', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/organizations/42' },
      {
        body: {
          id: 42,
          nameId: 17,
          name: 'Old organization',
          language: 'eng',
          type: null,
          country: 'FR',
          customMessage: 'Test description'
        }
      }
    );
    cy.intercept(
      { method: 'PATCH', pathname: '/api/v1/names/17' },
      { body: {} }
    ).as('updateName');
    cy.intercept(
      { method: 'PUT', pathname: '/api/v1/organizations/42' },
      {
        statusCode: 400,
        body: { message: 'Test rejection' }
      }
    ).as('updateOrganization');
    visitForm('/organizations/42/edit');
    cy.get('[data-testid="organization-name"] input').clear();
    cy.get('[data-testid="organization-name"] input').type(
      'Renamed organization'
    );
    cy.contains('button', 'Update').click();
    cy.contains('Choose an organization type.').should('be.visible');
    cy.get('@updateName.all').should('have.length', 0);
    cy.get('@updateOrganization.all').should('have.length', 0);
    selectType('CAVE_RESCUE');
    cy.contains('button', 'Update').click();
    cy.wait('@updateName');
    cy.wait('@updateOrganization')
      .its('request.body.type')
      .should('eq', 'CAVE_RESCUE');
  });

  it('lets users classify the name language without renaming the organization', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/organizations/42' },
      {
        body: {
          id: 42,
          nameId: 17,
          name: 'Old organization',
          language: '000',
          type: 'SPELEOLOGY',
          country: 'FR',
          customMessage: 'Test description'
        }
      }
    );
    cy.intercept(
      { method: 'PATCH', pathname: '/api/v1/names/17' },
      { body: {} }
    ).as('updateNameLanguage');
    cy.intercept(
      { method: 'PUT', pathname: '/api/v1/organizations/42' },
      { statusCode: 400, body: { message: 'Test rejection' } }
    ).as('saveOrganization');
    visitForm('/organizations/42/edit');
    cy.contains('[role="combobox"]', 'Select a language').click();
    cy.contains('[role="option"]', 'French').click();
    cy.contains('button', 'Update').click();
    cy.wait('@updateNameLanguage').its('request.body').should('include', {
      name: 'Old organization',
      language: 'fra'
    });
    cy.wait('@saveOrganization');
    cy.contains('[role="combobox"]', 'French').scrollIntoView();
    cy.contains('[role="combobox"]', 'French').should('be.visible');
  });
});
