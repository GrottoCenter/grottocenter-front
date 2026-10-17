const organization = type => ({
  id: 42,
  name: 'Example organization',
  type,
  nameId: 17,
  language: 'eng',
  customMessage: 'Description',
  country: 'FR',
  cavers: [{ id: 1, nickname: 'TestCaver' }],
  exploredEntrances: [{ id: 7, name: 'An entrance' }],
  exploredNetworks: [{ id: 8, name: 'A network', length: 100, depth: 10 }],
  authoredDocuments: [],
  publishedDocuments: [],
  authoredCount: 0,
  publishedCount: 0
});

const visit = path => {
  cy.loginAs();
  cy.visit(path, {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', 'en');
      win.localStorage.setItem(
        'grottocenter_selectedLayers',
        JSON.stringify({
          entrances: true,
          networks: false,
          massifs: false,
          organizations: true
        })
      );
    }
  });
};

describe('Organization type presentation', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      {
        body: { languages: [{ id: 'eng', part1: 'en', refName: 'English' }] }
      }
    );
  });

  [
    ['EDITION', 'Publisher', false],
    ['RESEARCH', 'Research organization', true],
    [null, 'Type not specified', true]
  ].forEach(([type, label, hasExploration]) => {
    it(`adapts the organization page for ${type}`, () => {
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/organizations/42' },
        { body: organization(type) }
      );
      visit('/organizations/42');
      cy.get('[data-testid="organization-type-label"]').should(
        'have.text',
        label
      );
      cy.get('[data-testid="organization-type-label"]')
        .parent()
        .should('match', ':last-child')
        .find('img')
        .should('have.length', 1);
      cy.get('h1').find('img').should('have.attr', 'alt', 'Organization');
      cy.get('[id="members"]').should(hasExploration ? 'exist' : 'not.exist');
      cy.get('[id="related-caves"]').should(
        hasExploration ? 'exist' : 'not.exist'
      );
      cy.get('img[alt="cavers"]').should(
        hasExploration ? 'exist' : 'not.exist'
      );
      cy.get('img[alt="networks"]').should(
        hasExploration ? 'exist' : 'not.exist'
      );
      cy.get('img[alt="entrances"]').should(
        hasExploration ? 'exist' : 'not.exist'
      );
      cy.screenshot(`organization-${type ?? 'unclassified'}`, {
        capture: 'viewport'
      });
    });
  });

  it('defaults search to All and sends or clears the explicit API type filter', () => {
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/advanced-search' },
      req => {
        req.reply({
          body: {
            results: [
              { ...organization('EDITION'), id: '42', _type: 'organizations' }
            ],
            totalResults: 1,
            totalEntities: 1,
            page: 1
          }
        });
      }
    ).as('searchOrganizations');
    visit('/organizations');
    cy.wait('@searchOrganizations')
      .its('request.body.filter')
      .should('not.have.property', 'type');
    cy.get('[data-testid="entity-type-filter"]')
      .find('img')
      .should('not.exist');
    cy.get('[data-testid="entity-type-filter"]')
      .contains('[role="button"]', 'All')
      .should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-testid="entity-type-filter"]')
      .contains('[role="button"]', 'Publisher')
      .click();
    cy.wait('@searchOrganizations')
      .its('request.body.filter.type')
      .should('eq', 'EDITION');
    cy.get('[data-testid="entity-type-filter"]')
      .contains('[role="button"]', 'All')
      .click();
    cy.wait('@searchOrganizations')
      .its('request.body.filter')
      .should('not.have.property', 'type');
    cy.contains('td', 'Example organization').find('img').should('not.exist');
    cy.contains('td', 'Publisher').find('img').should('have.length', 1);
    cy.screenshot('organization-search-types', { capture: 'viewport' });
    cy.viewport(390, 844);
    cy.get('[data-testid="entity-type-filter"]')
      .contains('[role="button"]', 'Library / documentation centre')
      .should('be.visible');
    cy.get('button[aria-label="Card view"]').click();
    cy.contains('a', 'Example organization')
      .find('img')
      .should('have.length', 1);
    cy.screenshot('organization-search-types-mobile', { capture: 'viewport' });
  });

  it('uses the organization pictograms on the detailed map markers', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/**' },
      { body: [] }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/organizations' },
      {
        body: [
          {
            id: 42,
            name: 'Club',
            address: '1 Club street',
            type: 'SPELEOLOGY',
            latitude: 45,
            longitude: 6
          },
          {
            id: 43,
            name: 'Rescue',
            type: 'CAVE_RESCUE',
            latitude: 45.001,
            longitude: 6.001
          }
        ]
      }
    );
    visit('/map/45,6,17');
    cy.get('[data-organization-type="SPELEOLOGY"] image', {
      timeout: 15000
    }).should('have.attr', 'href');
    cy.get('[data-organization-type="CAVE_RESCUE"] image').should(
      'have.attr',
      'href'
    );
    cy.get('[data-organization-type="SPELEOLOGY"]').click();
    cy.get('.leaflet-popup-content').within(() => {
      cy.get('.map-popup-title').should('have.text', 'CLUB');
      cy.get('.map-popup-title').parent().find('img').should('not.exist');
      cy.contains('.map-popup-property', 'Caving club')
        .find('img')
        .should('have.length', 1);
      cy.contains('.map-popup-property', '1 Club street').should('be.visible');
    });
    cy.screenshot('organization-map-pictograms', { capture: 'viewport' });
  });
});
