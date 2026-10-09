const COORDINATES = [
  [5.495, 45.5, 1, 0, null],
  [5.505, 45.5, 2, 40, 4.9],
  [5.5, 45.5, 3, 70, 7.5],
  [5.5, 45.505, 3, 69, 9]
];
const ENTRANCES = COORDINATES.map(
  ([longitude, latitude, size, dataQuality, aestheticism], i) => ({
    id: i + 1,
    name: ['Small unrated', 'Medium rated', 'Large good', 'Large satisfactory'][
      i
    ],
    longitude,
    latitude,
    depth: [0, 30, 100][size - 1],
    length: 0,
    dataQuality,
    aestheticism
  })
);

const openFilters = () =>
  cy.get('[data-tour="filters-control-toggle"]').click();
const bubbles = () => cy.get('[data-testid="entrance-cluster"]');
const selectInterest = stars =>
  cy
    .get(`[data-testid="entrance-interest-filter"] input[value="${stars}"]`)
    .invoke('attr', 'id')
    .then(id => cy.get(`label[for="${id}"]`).click('right'));
const expectCount = count =>
  bubbles().should(elements => {
    const total = elements
      .toArray()
      .reduce((sum, element) => sum + Number(element.dataset.count), 0);
    expect(total).to.eq(count);
  });
const expectZoom = zoom =>
  cy.window().should(win => {
    const saved = JSON.parse(
      win.localStorage.getItem('grottocenter_map_position')
    );
    expect(saved.zoom).to.eq(zoom);
  });

const visitMap = ({ legacy = false, minimum = 0 } = {}) => {
  cy.mockApiCatchAll();
  cy.intercept(
    { method: 'GET', pathname: /\/api\/v1\/geoloc\/.*Coordinates$/ },
    { body: [] }
  );
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/geoloc/entrancesCoordinates' },
    {
      body: legacy ? COORDINATES.map(tuple => tuple.slice(0, 2)) : COORDINATES
    }
  ).as('coordinates');
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/geoloc/entrances' },
    { body: ENTRANCES }
  ).as('markers');
  cy.visit('/map/45.5,5.5,10', {
    onBeforeLoad: win => {
      win.localStorage.setItem('mapTourSeen_v2', 'true');
      win.localStorage.setItem(
        'grottocenter_minInterest',
        JSON.stringify(minimum)
      );
      win.localStorage.setItem(
        'grottocenter_selectedLayers',
        JSON.stringify({
          entrances: true,
          networks: false,
          massifs: false,
          organizations: false
        })
      );
      win.localStorage.removeItem('grottocenter_activeEntranceFilters');
      win.localStorage.removeItem('grottocenter_activeQualityFilters');
    }
  });
  cy.wait('@coordinates');
  cy.get('.leaflet-container', { timeout: 20000 }).should('be.visible');
};

describe('Entrance filters at every zoom', () => {
  it('filters worker clusters by size, quality and interest, including empty/reset results', () => {
    visitMap();
    expectCount(4);
    openFilters();
    cy.get('[data-testid="entrance-size-small"]')
      .should('be.enabled')
      .uncheck();
    expectCount(3);
    cy.get('[data-testid="entrance-size-medium"]').uncheck();
    expectCount(2);
    cy.get('[data-testid="entrance-quality-satisfactory"]').uncheck();
    expectCount(1);
    selectInterest(4);
    expectCount(1); // 7.5/10 is displayed as four stars.
    selectInterest(5);
    bubbles().should('not.exist');
    cy.get('[data-testid="reset-entrance-filters"]').click();
    expectCount(4);
  });

  it('retains filters and working clicks across the cluster/marker zoom boundary on mobile', () => {
    cy.viewport(390, 844);
    visitMap();
    expectCount(4);
    openFilters();
    cy.get('[data-testid="entrance-size-small"]').parent().click();
    cy.get('[data-testid="entrance-size-medium"]').parent().click();
    cy.get('[data-testid="entrance-quality-satisfactory"]').parent().click();
    expectCount(1);
    cy.get('[data-tour="filters-control-toggle"]')
      .parent()
      .trigger('mouseout', { relatedTarget: null });
    cy.get('[data-tour="filters-control-toggle"]').should('be.visible');
    bubbles().click(); // Isolated retained entrance flies from zoom 10 to 14.
    cy.wait('@markers');
    cy.url().should('match', /(?:,|%2C)14$/i);
    expectZoom(14);
    bubbles().should('not.exist');
    cy.get('.leaflet-overlay-pane canvas').click('center');
    cy.get('.leaflet-popup-content').should('contain.text', 'Large good');
    expectZoom(14);
    cy.get('.leaflet-popup-close-button').click();
    cy.url().should('match', /(?:,|%2C)14$/i);
    expectZoom(14);
    // The left edge is reserved for the mobile side menu's swipe gesture.
    cy.get('.leaflet-control-zoom-out').click(24, 15);
    expectZoom(13);
    cy.url().should('match', /(?:,|%2C)13$/i);
    cy.get('.leaflet-control-zoom-out').click(24, 15);
    expectCount(1);
    openFilters();
    cy.get('[data-testid="entrance-size-small"]').should('not.be.checked');
    cy.get('[data-testid="reset-entrance-filters"]').click();
    expectCount(4);
  });

  it('applies a saved interest minimum at the initial low zoom', () => {
    visitMap({ minimum: 8 });
    expectCount(2);
    cy.get('@coordinates')
      .its('request.query.criteriaVersion')
      .should('eq', '1');
  });

  it('keeps legacy pairs visible and explains why cluster filters need updated data', () => {
    visitMap({ legacy: true, minimum: 8 });
    expectCount(4);
    openFilters();
    cy.get('[data-testid="entrance-filters-unavailable"]').should('be.visible');
    cy.get('[data-testid="entrance-size-small"]').should('be.disabled');
    cy.get('[data-testid="entrance-interest-filter"] input').should(
      'be.disabled'
    );
  });
});
