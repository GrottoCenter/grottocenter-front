const PROJECTIONS = [
  {
    code: 'EPSG:2154',
    title: 'Lambert 93',
    definition:
      '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs',
    proj: 'lcc',
    units: 'meters',
    iso2: 'FR'
  },
  {
    code: 'EPSG:3857',
    title: 'Web Mercator',
    definition:
      '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +no_defs',
    proj: 'merc',
    units: 'meters'
  }
];

describe('Map context-menu coordinate systems', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept('GET', '**/api/convert', { body: PROJECTIONS }).as(
      'projections'
    );
    cy.intercept(
      { method: 'GET', pathname: /\/api\/v1\/geoloc\/.*/ },
      { body: [] }
    );
  });

  [1280, 360].forEach(width => {
    it(`loads, searches and selects API projections at ${width}px`, () => {
      cy.viewport(width, 720);
      cy.visit('/map/45.5,5.5,13', {
        onBeforeLoad: win => {
          win.localStorage.setItem('selectedLanguage', 'en');
          win.localStorage.setItem('mapTourSeen_v2', 'true');
          win.localStorage.setItem('preferredCoordinateSystem', 'WGS84_DD');
        }
      });
      cy.wait('@projections');
      cy.get('[data-tour="filters-control-toggle"]').should('be.visible');
      cy.location('pathname').should('include', '%2C');
      cy.get('.leaflet-container').rightclick(80, 180);
      cy.get('[aria-label="Change coordinate system"]').click();

      cy.contains('[role="menuitem"]', 'Decimal degrees (WGS84)').should(
        'be.visible'
      );
      cy.contains('[role="menuitem"]', 'Degrees Minutes Seconds').should(
        'be.visible'
      );
      cy.contains('[role="menuitem"]', 'Lambert 93').should('be.visible');
      cy.contains('[role="menuitem"]', 'Web Mercator').should('be.visible');
      cy.get('input[placeholder="Search"]').type('EPSG:2154');
      cy.contains('[role="menuitem"]', 'Web Mercator').should('not.exist');
      cy.contains('[role="menuitem"]', 'Lambert 93').click();

      cy.contains('Point coordinates (Lambert 93)').should('be.visible');
      cy.contains(/^X: \d+, Y: \d+$/).should('be.visible');
      cy.window().should(win => {
        expect(win.localStorage.getItem('preferredCoordinateSystem')).to.equal(
          'EPSG:2154'
        );
      });
    });
  });
});
