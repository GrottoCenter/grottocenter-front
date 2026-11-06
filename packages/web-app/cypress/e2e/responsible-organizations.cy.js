const createdOrganization = {
  id: 42,
  name: 'New research organization',
  type: 'RESEARCH'
};

const scopes = [
  { name: 'country', path: '/countries/FR', data: { id: 'FR' } },
  {
    name: 'region',
    path: '/countries/US/regions/TN',
    data: { id: 'TN', name: 'Tennessee' }
  },
  { name: 'massif', path: '/massifs/7', data: { id: 7, name: 'Test massif' } }
];

const setupScope = (
  scope,
  { organization = createdOrganization, rejectFirstAssociation = false } = {}
) => {
  let organizations = [];
  let attempts = 0;
  cy.intercept('GET', `**/api/v1${scope.path}`, request =>
    request.reply({ body: { ...scope.data, organizations } })
  ).as('geography');
  cy.intercept('PUT', `**/api/v1${scope.path}/organizations/42`, request => {
    attempts += 1;
    if (rejectFirstAssociation && attempts === 1) {
      request.reply({ statusCode: 500, body: { message: 'Private detail' } });
    } else {
      organizations = [organization];
      request.reply({ body: {} });
    }
  }).as('associateOrganization');
  cy.visit(scope.path, {
    onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
  });
  cy.wait('@geography');
  cy.get('[data-testid="toggle-organization-association"]', {
    timeout: 30000
  }).scrollIntoView();
  cy.get('[data-testid="toggle-organization-association"]').click();
  cy.get('[data-testid="responsible-organization-search"]').should(
    'be.visible'
  );
};

const openCreation = () => {
  cy.get('[data-testid="responsible-organization-search"]').type(
    'New research organization'
  );
  cy.get(
    '[data-testid="create-responsible-organization-search-button"]'
  ).click();
  cy.get('[data-testid="related-entity-dialog"]').should('be.visible');
};

const createOrganization = () => {
  cy.get('[data-testid="organization-type-field"] [role="combobox"]').click();
  cy.get('[data-testid="type-RESEARCH"]').click();
  cy.get('[data-testid="create-related-entity"]').click();
  cy.wait('@createOrganization').then(({ request }) => {
    expect(request.body.name).to.deep.equal({
      text: 'New research organization',
      language: 'eng'
    });
    expect(request.body.type).to.equal('RESEARCH');
    expect(request.body.country).to.deep.equal({ id: null });
  });
  cy.get('[data-testid="related-entity-dialog"]').should('not.exist');
  cy.get('[data-testid="responsible-organization-search"]')
    .should('have.value', 'New research organization')
    .and('have.focus');
};

describe('Responsible organizations share contextual organization creation', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept('GET', '**/api/v1/languages*', {
      body: { languages: [{ id: 'eng', part1: 'en', refName: 'English' }] }
    });
    cy.intercept('POST', '**/api/v1/search', { body: { results: [] } });
    cy.intercept('POST', '**/api/v1/organizations', {
      body: createdOrganization
    }).as('createOrganization');
    cy.loginAs();
  });

  scopes.forEach(scope => {
    [
      [1280, 900, 'desktop'],
      [390, 844, 'mobile']
    ].forEach(([width, height, viewport]) => {
      it(`creates, selects and then associates an organization to a ${scope.name} on ${viewport}`, () => {
        cy.viewport(width, height);
        setupScope(scope);
        cy.get('[data-testid="responsible-organization-search"]').should(
          'have.attr',
          'placeholder',
          'Search for an organization...'
        );
        cy.get(
          '[data-testid="create-responsible-organization-search-button"]'
        ).should('not.exist');
        cy.get('[data-testid="organization-type-field"]').should('not.exist');
        openCreation();
        cy.get('[data-testid="organization-name"] input').should(
          'have.value',
          'New research organization'
        );
        cy.get('[data-testid="related-entity-dialog"]').within(() => {
          cy.contains(
            'The organization will be created and selected in the form.'
          ).should('be.visible');
          cy.get('input[name^="organization."]').should('have.length', 5);
          cy.get('[name="organization.country"]').should('have.value', '');
          cy.get('[name="organization.city"]').type('Lyon');
          cy.get('[name="organization.url"]').type('https://example.org');
        });
        createOrganization();
        cy.get('@associateOrganization.all').should('have.length', 0);
        cy.get('[data-testid="associate-organization-button"]').click();
        cy.wait('@associateOrganization')
          .its('request.method')
          .should('eq', 'PUT');
        cy.wait('@geography');
        cy.get('[data-testid="organization-association-form"]').should(
          'not.exist'
        );
        cy.get('#organizations').should(
          'contain.text',
          'New research organization'
        );
        cy.get('@createOrganization.all').should('have.length', 1);
      });
    });
  });

  it('keeps a created organization selected after association fails and retries only the association', () => {
    cy.viewport(1280, 900);
    setupScope(scopes[0], { rejectFirstAssociation: true });
    openCreation();
    createOrganization();
    cy.get('[data-testid="associate-organization-button"]').click();
    cy.wait('@associateOrganization');
    cy.get('[data-testid="organization-association-form"]')
      .should('contain.text', 'A server error occurred')
      .and('not.contain.text', 'Private detail');
    cy.get('[data-testid="responsible-organization-search"]').should(
      'have.value',
      'New research organization'
    );
    cy.get('[data-testid="associate-organization-button"]').click();
    cy.wait('@associateOrganization');
    cy.get('[data-testid="organization-association-form"]').should('not.exist');
    cy.get('@createOrganization.all').should('have.length', 1);
    cy.get('@associateOrganization.all').should('have.length', 2);
  });

  it('cancels creation locally and associates an existing unclassified organization', () => {
    const organization = { id: 42, name: 'Existing organization', type: null };
    cy.viewport(390, 844);
    setupScope(scopes[0], { organization });
    openCreation();
    cy.get('[data-testid="related-entity-dialog"]')
      .contains('button', /^Cancel$/)
      .click();
    cy.get('[data-testid="related-entity-dialog"]').should('not.exist');
    cy.get('[data-testid="responsible-organization-search"]')
      .should('have.value', 'New research organization')
      .and('have.focus');
    cy.get('@createOrganization.all').should('have.length', 0);
    cy.intercept('POST', '**/api/v1/search', {
      body: { results: [{ ...organization, _type: 'organizations' }] }
    });
    cy.get('[data-testid="responsible-organization-search"]').clear();
    cy.get('[data-testid="responsible-organization-search"]').type('Existing');
    cy.contains('[role="option"]', 'Existing organization').click();
    cy.get('[data-testid="organization-type-field"]').should('not.exist');
    cy.get('[data-testid="associate-organization-button"]').click();
    cy.wait('@associateOrganization');
    cy.get('[data-testid="organization-association-form"]').should('not.exist');
    cy.get('#organizations').should('contain.text', 'Existing organization');
    cy.get('@createOrganization.all').should('have.length', 0);
  });

  it('clears failed association errors when reopening the form and changing the selection', () => {
    cy.viewport(1280, 900);
    setupScope(scopes[0], { rejectFirstAssociation: true });
    openCreation();
    createOrganization();
    cy.get('[data-testid="associate-organization-button"]').click();
    cy.wait('@associateOrganization');
    cy.get('[data-testid="organization-association-form"]').should(
      'contain.text',
      'A server error occurred'
    );
    cy.get('[data-testid="toggle-organization-association"]').click();
    cy.get('[data-testid="organization-association-form"]').should('not.exist');
    cy.get('[data-testid="toggle-organization-association"]').click();
    cy.get('[data-testid="organization-association-form"]').should(
      'not.contain.text',
      'A server error occurred'
    );
    cy.intercept('POST', '**/api/v1/search', {
      body: { results: [{ ...createdOrganization, _type: 'organizations' }] }
    });
    cy.get('[data-testid="responsible-organization-search"]').type('research');
    cy.contains('[role="option"]', createdOrganization.name).click();
    cy.intercept('PUT', '**/api/v1/countries/FR/organizations/42', {
      statusCode: 500,
      body: {}
    });
    cy.get('[data-testid="associate-organization-button"]').click();
    cy.get('[data-testid="organization-association-form"]').should(
      'contain.text',
      'A server error occurred'
    );
    cy.get('[data-testid="responsible-organization-search"]').clear();
    cy.get('[data-testid="organization-association-form"]').should(
      'not.contain.text',
      'A server error occurred'
    );
    cy.get('@createOrganization.all').should('have.length', 1);
  });
});
