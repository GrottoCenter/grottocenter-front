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
const toggleCheckbox = (selector, checked) => {
  // Native keyboard activation has no synthetic touch click. Rapid Cypress
  // mouse clicks on controls can also trigger Leaflet's double-tap zoom.
  cy.get(selector)
    .should(checked ? 'not.be.checked' : 'be.checked')
    .focus();
  cy.press(Cypress.Keyboard.Keys.SPACE);
  cy.get(selector).should(checked ? 'be.checked' : 'not.be.checked');
};
const selectInterest = stars => {
  // MUI prioritizes mouse hover over a radio's value. Use native keyboard
  // selection to avoid a stale hover during Firefox's simulated label click.
  cy.get('[data-testid="entrance-interest-filter"]').trigger('mouseleave');
  cy.get(
    `[data-testid="entrance-interest-filter"] input[value="${stars}"]`
  ).focus();
  cy.press(Cypress.Keyboard.Keys.SPACE);
  cy.get(
    `[data-testid="entrance-interest-filter"] input[value="${stars}"]`
  ).should('be.checked');
  cy.window().should(win => {
    expect(
      JSON.parse(win.localStorage.getItem('grottocenter_minInterest'))
    ).to.eq(stars * 2);
  });
};
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

const visitMap = ({
  legacy = false,
  minimum = 0,
  zoom = 10,
  massifs = false,
  isWorkerUnavailable = false,
  isOffline = false
} = {}) => {
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
  if (massifs) {
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/massifsCoordinates' },
      { body: [[5.5, 45.5]] }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/massifs' },
      { body: [] }
    ).as('polygons');
  }
  cy.visit(`/map/45.5,5.5,${zoom}`, {
    onBeforeLoad: win => {
      if (isWorkerUnavailable) {
        Object.defineProperty(win, 'Worker', {
          configurable: true,
          value: class {
            constructor() {
              throw new Error('Worker unavailable');
            }
          }
        });
      }
      if (isOffline) {
        Object.defineProperty(win.navigator, 'onLine', {
          configurable: true,
          get: () => false
        });
      }
      win.localStorage.setItem('selectedLanguage', 'fr');
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
          massifs,
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
  beforeEach(() => cy.disableServiceWorker());

  it('filters worker clusters by size, quality and interest, including empty/reset results', () => {
    visitMap();
    expectCount(4);
    openFilters();
    cy.get('[data-testid="entrance-size-small"]').should('be.enabled');
    toggleCheckbox('[data-testid="entrance-size-small"]', false);
    expectCount(3);
    toggleCheckbox('[data-testid="entrance-size-medium"]', false);
    expectCount(2);
    toggleCheckbox('[data-testid="entrance-quality-satisfactory"]', false);
    expectCount(1);
    selectInterest(4);
    expectCount(1); // 7.5/10 is displayed as four stars.
    selectInterest(5);
    bubbles().should('not.exist');
    cy.get('[data-testid="reset-entrance-filters"]').click();
    expectCount(4);
  });

  it('retains filters and popup clicks across the cluster/marker zoom boundary in a small viewport', () => {
    cy.viewport(390, 844);
    visitMap();
    expectCount(4);
    openFilters();
    toggleCheckbox('[data-testid="entrance-size-small"]', false);
    expectCount(3);
    toggleCheckbox('[data-testid="entrance-size-medium"]', false);
    expectCount(2);
    toggleCheckbox('[data-testid="entrance-quality-satisfactory"]', false);
    expectCount(1);
    expectZoom(10);
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
    // The popup pans the map while opening. Activate its close control
    // directly so a moving hit target cannot turn the simulated click into
    // a second map tap. Opening the entrance above uses a pointer click.
    cy.get('.leaflet-popup-close-button').trigger('click');
    // Opening a popup pans the map. Wait for that movement before the next
    // gesture; the stored zoom alone cannot signal that the pan has finished.
    cy.get('.leaflet-map-pane').should('not.have.class', 'leaflet-pan-anim');
    cy.url().should('match', /(?:,|%2C)14$/i);
    expectZoom(14);
    // Click inside the control, away from the side menu's edge swipe area.
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
    cy.get('[data-testid="entrance-filters-unavailable"]').should(
      'contain.text',
      'Connectez-vous à Internet pour utiliser les filtres à ce niveau de zoom.'
    );
    cy.get('[data-testid="entrance-size-small"]').should('be.disabled');
    cy.get('[data-testid="entrance-interest-filter"] input').should(
      'be.disabled'
    );
  });

  it('allows detailed-marker filters with a legacy cache and disables them again below the threshold', () => {
    visitMap({ legacy: true, minimum: 8, zoom: 13 });
    cy.wait('@markers');
    bubbles().should('not.exist');
    openFilters();
    cy.get('[data-testid="entrance-filters-unavailable"]').should('not.exist');
    cy.get('[data-testid="entrance-size-small"]').should('be.enabled');
    cy.get('[data-tour="filters-control-toggle"]')
      .parent()
      .trigger('mouseout', { relatedTarget: null });
    cy.get('.leaflet-control-zoom-out').click();
    expectZoom(12);
    expectCount(4);
    openFilters();
    cy.get('[data-testid="entrance-size-small"]').should('be.disabled');
  });

  it('refreshes legacy coordinates on reconnect and enables saved filters without reloading', () => {
    visitMap({ legacy: true, minimum: 8, isOffline: true });
    expectCount(4);
    openFilters();
    cy.get('[data-testid="entrance-size-small"]').should('be.disabled');
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/entrancesCoordinates' },
      { body: COORDINATES }
    ).as('updatedCoordinates');
    cy.window().then(win => {
      Object.defineProperty(win.navigator, 'onLine', { get: () => true });
      win.dispatchEvent(new win.Event('online'));
    });
    cy.wait('@updatedCoordinates');
    expectCount(2);
    cy.get('[data-testid="entrance-filters-unavailable"]').should('not.exist');
    cy.get('[data-testid="entrance-size-small"]').should('be.enabled');
    cy.get('@updatedCoordinates.all').should('have.length', 1);
  });

  it('keeps bubbles and filters usable when the Worker cannot start', () => {
    visitMap({ minimum: 8, isWorkerUnavailable: true });
    expectCount(2);
    openFilters();
    cy.get('[data-testid="entrance-size-small"]').should('be.enabled');
    toggleCheckbox('[data-testid="entrance-quality-satisfactory"]', false);
    expectCount(1);
    cy.get('[data-testid="reset-entrance-filters"]').click();
    expectCount(4);
    cy.get('[data-tour="filters-control-toggle"]')
      .parent()
      .trigger('mouseout', { relatedTarget: null });
    bubbles().click();
    cy.wait('@markers');
    expectZoom(15);
    bubbles().should('not.exist');
  });

  it('preserves filters when the entrance layer is hidden and shown again', () => {
    visitMap();
    expectCount(4);
    openFilters();
    toggleCheckbox('[data-testid="entrance-size-small"]', false);
    expectCount(3);
    cy.get('[data-tour="filters-control-toggle"]')
      .parent()
      .trigger('mouseout', { relatedTarget: null });
    cy.get('[data-tour="data-control-toggle"]').click();
    toggleCheckbox('input[name="entrances"]', false);
    bubbles().should('not.exist');
    cy.get('[data-tour="data-control-toggle"]')
      .parent()
      .trigger('mouseout', { relatedTarget: null });
    openFilters();
    cy.get('[data-testid="entrance-size-small"]')
      .should('be.disabled')
      .should('not.be.checked');
    cy.get('[data-tour="filters-control-toggle"]')
      .parent()
      .trigger('mouseout', { relatedTarget: null });
    cy.get('[data-tour="data-control-toggle"]').click();
    toggleCheckbox('input[name="entrances"]', true);
    expectCount(3);
  });

  it('keeps the massif threshold independent from entrance filters and marker requests', () => {
    visitMap({ zoom: 7, massifs: true });
    expectCount(4);
    cy.get('[data-testid="massif-cluster"]').should('exist');
    openFilters();
    selectInterest(4);
    expectCount(2);
    cy.get('[data-testid="massif-cluster"]').should('exist');
    cy.get('[data-tour="filters-control-toggle"]')
      .parent()
      .trigger('mouseout', { relatedTarget: null });
    cy.get('.leaflet-control-zoom-in').click();
    expectZoom(8);
    cy.wait('@polygons').its('request.query.zoom').should('eq', '8');
    cy.get('[data-testid="massif-cluster"]').should('not.exist');
    cy.get('@markers.all').should('have.length', 0);
    cy.get('.leaflet-control-zoom-out').click();
    expectZoom(7);
    cy.get('[data-testid="massif-cluster"]').should('exist');
    expectCount(2);
  });
});
