const surfacePoint = {
  id: 6,
  label: 'Surface station',
  underground: false,
  latitude: 45.5,
  longitude: 5.5,
  city: 'Test city',
  region: 'Test region',
  country: 'Test country',
  documents: [],
  positions: [],
  isDeleted: false
};

const visitMap = (zoom, points = false) => {
  cy.visit(`/map/45.5,5.5,${zoom}`, {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', 'en');
      win.localStorage.setItem('mapTourSeen_v2', 'true');
      win.localStorage.setItem(
        'grottocenter_selectedLayers',
        JSON.stringify({
          entrances: false,
          networks: false,
          massifs: false,
          organizations: false,
          ...(points ? { points: true } : {})
        })
      );
    }
  });
};

describe('Surface points on the global map', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: /\/api\/v1\/geoloc\/.*Coordinates$/ },
      { body: [] }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/pointsCoordinates' },
      {
        body: [
          [5.5, 45.5, false],
          [5.5, 45.5, true],
          [5.5, 45.5, null]
        ]
      }
    ).as('pointCoordinates');
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/points' },
      {
        body: [
          surfacePoint,
          { ...surfacePoint, id: 7, underground: true },
          { ...surfacePoint, id: 8, underground: null },
          { ...surfacePoint, id: 9, isDeleted: true }
        ]
      }
    ).as('pointMarkers');
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/points/6' },
      { body: surfacePoint }
    );
  });

  it('defaults to off, clusters only surface points and remembers the toggle', () => {
    visitMap(10);
    cy.get('[data-tour="data-control-toggle"]').click();
    cy.get('input[name="points"]').should('not.be.checked').focus();
    cy.get('@pointCoordinates.all').should('have.length', 0);
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.wait('@pointCoordinates')
      .its('request.query.underground')
      .should('eq', 'false');
    cy.get('[data-testid="point-cluster"]')
      .should('have.length', 1)
      .and('have.attr', 'data-count', '1');
    cy.reload();
    cy.get('[data-testid="point-cluster"]').should('be.visible');
    cy.get('[data-tour="data-control-toggle"]').click();
    cy.get('input[name="points"]').should('be.checked').focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get('[data-testid="point-cluster"]').should('not.exist');
  });

  it('shows filtered markers at detail zoom and opens the point through its popup', () => {
    visitMap(13, true);
    cy.wait('@pointMarkers')
      .its('request.query.underground')
      .should('eq', 'false');
    cy.get('[data-testid="point-map-marker"]').should('have.length', 1).click();
    cy.get('.leaflet-popup').should(
      'contain',
      'Test city, Test region, Test country'
    );
    cy.get('.leaflet-popup a').contains('Surface station').click();
    cy.url().should('include', '/ui/points/6');
  });

  it('switches from clusters to markers on mobile and removes them when disabled', () => {
    cy.viewport(390, 844);
    visitMap(10, true);
    cy.get('[data-testid="point-cluster"]').click();
    cy.wait('@pointMarkers');
    cy.get('[data-testid="point-cluster"]').should('not.exist');
    cy.get('[data-testid="point-map-marker"]').should('have.length', 1);
    cy.get('[data-tour="data-control-toggle"]').click();
    cy.get('input[name="points"]').should('be.checked').focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get('[data-testid="point-map-marker"]').should('not.exist');
  });
});
