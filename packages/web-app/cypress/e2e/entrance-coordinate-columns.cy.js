const coordinateColumns = ['Latitude', 'Longitude', 'Altitude'];
// The entrance search always includes its existing Massif column.
const exportColumns = ['name', 'latitude', 'longitude', 'altitude', 'massifs'];
const results = [
  {
    id: 42,
    name: 'Public entrance',
    latitude: 45.123456789,
    longitude: -0.123456789,
    altitude: -120
  },
  { id: 43, name: 'Zero entrance', latitude: 0, longitude: 0, altitude: 0 },
  {
    id: 44,
    name: 'Sensitive entrance',
    isSensitive: true,
    latitude: null,
    longitude: null,
    altitude: 1800
  },
  { id: 45, name: 'Missing coordinates' }
];

const selectCoordinates = menuLabel => {
  cy.contains('button', menuLabel).click();
  coordinateColumns.forEach(label => {
    cy.contains('[role="menuitem"]', new RegExp(`^${label}$`)).click();
  });
  cy.get('[role="menu"]').type('{esc}');
};

const assertCsvRequest = () => {
  cy.wait('@export').then(({ request }) => {
    const body =
      typeof request.body === 'string'
        ? JSON.parse(request.body)
        : request.body;
    expect(body.entity).to.equal('entrances');
    expect(body.columns).to.deep.equal(exportColumns);
    expect(body.columnsName).to.deep.equal([
      'Name',
      ...coordinateColumns,
      'Massif'
    ]);
  });
};

describe('Entrance coordinate columns', () => {
  beforeEach(() => {
    cy.mockApiCatchAll();
    cy.intercept('POST', '**/api/v1/advanced-search', {
      results,
      totalResults: results.length,
      totalEntities: results.length,
      page: 1
    }).as('search');
    // The CSV is produced by the API. This stub verifies the frontend's
    // selection contract; sensitive-data redaction needs backend coverage.
    cy.intercept('POST', '**/api/v1/advanced-search/export?format=csv', {
      statusCode: 200,
      headers: { 'content-type': 'text/csv' },
      body: 'Name,Latitude,Longitude,Altitude\n'
    }).as('export');
  });

  it('selects, remembers and exports coordinates from the desktop table', () => {
    cy.viewport(1280, 900);
    cy.visit('/entrances', {
      onBeforeLoad: win => {
        win.localStorage.setItem('entityTable_entrances_columns', '["name"]');
      }
    });
    cy.wait('@search');
    cy.contains('th', 'Latitude').should('not.exist');
    selectCoordinates('Change columns');

    cy.contains('tr', 'Public entrance').within(() => {
      cy.get('td').should(
        'have.text',
        'Public entrance45.123456789-0.123456789-120-'
      );
    });
    cy.contains('tr', 'Zero entrance')
      .find('td')
      .should('have.text', 'Zero entrance000-');
    cy.contains('tr', 'Sensitive entrance')
      .find('td')
      .should('have.text', 'Sensitive entrance--1800-');
    cy.contains('tr', 'Missing coordinates')
      .find('td')
      .should('have.text', 'Missing coordinates----');

    cy.reload();
    cy.wait('@search');
    coordinateColumns.forEach(label =>
      cy.contains('th', label).should('exist')
    );
    cy.contains('button', /^Export$/).click();
    cy.contains('[role="menuitem"]', /^CSV$/).click();
    assertCsvRequest();
  });

  it('shows and exports the same selected coordinates in mobile cards', () => {
    cy.viewport(390, 844);
    cy.visit('/entrances', {
      onBeforeLoad: win => {
        win.localStorage.setItem('entityTable_entrances_columns', '["name"]');
      }
    });
    cy.wait('@search');
    cy.get('button[aria-label="Card view"]').click();
    selectCoordinates('Data');

    cy.get('a[href="/ui/entrances/42"]')
      .should('contain.text', '45.123456789')
      .and('contain.text', '-0.123456789')
      .and('contain.text', '-120');
    cy.get('a[href="/ui/entrances/43"]').should(
      'contain.text',
      'Latitude0Longitude0Altitude0'
    );
    cy.get('a[href="/ui/entrances/44"]').should(
      'contain.text',
      'Latitude-Longitude-Altitude1800'
    );
    cy.get('a[href="/ui/entrances/45"]').should(
      'contain.text',
      'Latitude-Longitude-Altitude-'
    );
    cy.get('button[aria-label="Export"]').click();
    cy.contains('[role="menuitem"]', /^CSV$/).click();
    assertCsvRequest();
  });
});
