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

    selectType('OTHER');
    cy.contains('button', 'Create').click();
    cy.wait('@createOrganization')
      .its('request.body.type')
      .should('eq', 'OTHER');
    cy.get('[data-testid="organization-type-field"] [role="combobox"]').should(
      'contain',
      'Other'
    );
  });

  it('requires classification before saving the name and organization together', () => {
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
    selectType('OTHER');
    cy.contains('button', 'Update').click();
    cy.wait('@updateOrganization')
      .its('request.body')
      .should('include', { type: 'OTHER' })
      .and('have.property', 'name')
      .and('deep.equal', { text: 'Renamed organization', language: 'eng' });
    cy.get('@updateName.all').should('have.length', 0);
  });

  it('validates optional email and URL formats before creating an organization', () => {
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/organizations' },
      { statusCode: 400, body: { message: 'Test rejection' } }
    ).as('createOrganization');
    visitForm('/entity/add/organization');
    cy.get('[data-testid="organization-name"] input').type('New organization');
    cy.get('[name="organization.customMessage"]').type('Test description');
    selectType('SPELEOLOGY');
    cy.get('[name="organization.mail"]').type('bad-email');
    cy.get('[name="organization.url"]').type('bad-url');
    cy.contains('button', 'Create').click();
    cy.contains('The email must be valid.').should('be.visible');
    cy.contains('The URL must be valid.').should('be.visible');
    cy.get('@createOrganization.all').should('have.length', 0);
    cy.get('[name="organization.mail"]').clear();
    cy.get('[name="organization.mail"]').type('contact@example.org');
    cy.get('[name="organization.url"]').clear();
    cy.get('[name="organization.url"]').type('https://example.org');
    cy.contains('button', 'Create').click();
    cy.wait('@createOrganization').its('request.body').should('include', {
      mail: 'contact@example.org',
      url: 'https://example.org'
    });
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
    cy.wait('@saveOrganization').its('request.body.name').should('deep.equal', {
      text: 'Old organization',
      language: 'fra'
    });
    cy.get('@updateNameLanguage.all').should('have.length', 0);
    cy.contains('[role="combobox"]', 'French').scrollIntoView();
    cy.contains('[role="combobox"]', 'French').should('be.visible');
  });
});
