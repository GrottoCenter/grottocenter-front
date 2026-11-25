const ENTRANCES = [
  {
    id: 1,
    name: 'Small cave',
    latitude: 45.5,
    longitude: 5.495,
    depth: 0,
    length: 0,
    dataQuality: 0,
    aestheticism: null
  },
  {
    id: 2,
    name: 'Medium cave',
    latitude: 45.5,
    longitude: 5.505,
    depth: 30,
    length: 0,
    dataQuality: 40,
    aestheticism: 4.9
  },
  {
    id: 3,
    name: 'Grotte & été',
    latitude: 45.5,
    longitude: 5.5,
    depth: 100,
    length: 0,
    dataQuality: 70,
    aestheticism: 7.5
  }
];
const DATE = '2026-11-24T12:00:00.000Z';
const basename = 'Grottocenter_map_export_2026-11-24T12-00-00-000Z';
const entranceLink = id => `https://grottocenter.org/ui/entrances/${id}`;
const xmlName = name => name.replaceAll('&', '&amp;');
const FILES = {
  gpx: `<gpx xmlns="http://www.topografix.com/GPX/1/1">${ENTRANCES.map(entrance => `<wpt lat="${entrance.latitude}" lon="${entrance.longitude}"><name>${xmlName(entrance.name)}</name><link href="${entranceLink(entrance.id)}" /></wpt>`).join('')}</gpx>`,
  kml: `<kml xmlns="http://www.opengis.net/kml/2.2"><Document>${ENTRANCES.map(entrance => `<Placemark><name>${xmlName(entrance.name)}</name><Point><coordinates>${entrance.longitude},${entrance.latitude}</coordinates></Point><ExtendedData><Data name="grottocenterUrl"><value>${entranceLink(entrance.id)}</value></Data></ExtendedData></Placemark>`).join('')}</Document></kml>`,
  geojson: JSON.stringify({
    type: 'FeatureCollection',
    features: ENTRANCES.map(entrance => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [entrance.longitude, entrance.latitude]
      },
      properties: {
        name: entrance.name,
        grottocenterUrl: entranceLink(entrance.id)
      }
    }))
  })
};
const TYPES = {
  gpx: 'application/gpx+xml',
  kml: 'application/vnd.google-earth.kml+xml',
  geojson: 'application/geo+json'
};
let releaseExport = () => {};

const visitMap = ({
  zoom = 13,
  status = 'ready',
  language = 'en',
  layer = true,
  offline = false
} = {}) => {
  cy.mockApiCatchAll();
  cy.intercept(
    { method: 'GET', pathname: /\/api\/v1\/geoloc\/.*Coordinates$/ },
    { body: [] }
  );
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/geoloc/entrancesCoordinates' },
    {
      body: ENTRANCES.map((entrance, index) => [
        entrance.longitude,
        entrance.latitude,
        index + 1,
        entrance.dataQuality,
        entrance.aestheticism
      ])
    }
  ).as('coordinates');
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/geoloc/entrances' },
    { body: ENTRANCES }
  );
  cy.intercept({ method: 'POST', pathname: '/api/v1/advanced-search' }, () => {
    throw new Error('Map export must not request an advanced-search preview');
  });
  cy.intercept(
    { method: 'POST', pathname: '/api/v1/advanced-search/export' },
    request => {
      expect(request.body.filter).to.have.all.keys(
        'latitude',
        'longitude',
        'isSensitive'
      );
      expect(request.body.filter.isSensitive).to.equal(false);
      const { latitude, longitude } = request.body.filter;
      ENTRANCES.forEach(entrance => {
        expect(entrance.latitude).to.be.within(...latitude);
        expect(entrance.longitude).to.be.within(...longitude);
      });
      expect(request.body.columns).to.deep.equal(['name']);
      const { format } = request.query;
      const reply = () =>
        request.reply({
          body: status === 'empty' ? '<gpx/>' : FILES[format],
          headers: { 'content-type': TYPES[format] }
        });
      if (status === 'error') {
        request.reply({ statusCode: 500, body: { message: 'Unavailable' } });
      } else if (status === 'loading') {
        return new Cypress.Promise(resolve => {
          releaseExport = () => {
            reply();
            resolve();
          };
        });
      } else reply();
      return undefined;
    }
  ).as('export');
  cy.visit(`/map/45.5,5.5,${zoom}`, {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', language);
      win.localStorage.setItem('grottocenter_minInterest', '8');
      win.localStorage.setItem(
        'grottocenter_activeEntranceFilters',
        JSON.stringify({ small: false, medium: false, large: true })
      );
      win.localStorage.setItem(
        'grottocenter_activeQualityFilters',
        JSON.stringify({ insufficient: false, satisfactory: false, good: true })
      );
      win.localStorage.setItem(
        'grottocenter_selectedLayers',
        JSON.stringify({
          entrances: layer,
          networks: false,
          massifs: false,
          organizations: false
        })
      );
      if (offline)
        Object.defineProperty(win.navigator, 'onLine', {
          configurable: true,
          get: () => false
        });
    }
  });
  cy.clock(new Date(DATE).getTime(), ['Date']);
  cy.wait('@coordinates');
  cy.get('.leaflet-container', { timeout: 20000 }).should('be.visible');
  // These controls mount after the map's contextmenu listeners are installed.
  // Coordinates are fetched independently by the page and can finish earlier.
  cy.get('[data-tour="filters-control-toggle"]').should('be.visible');
  // Wait for the initial shareable-URL update before focusing the map.
  cy.location('pathname').should('include', '%2C');
};

const openExport = () => {
  cy.get('.leaflet-container').rightclick(80, 180);
  cy.get('[data-testid="map-export-action"]')
    .should('not.have.attr', 'aria-disabled', 'true')
    .click();
  cy.get('[data-testid="map-export-dialog"]').should('be.visible');
};
const screenshot = name =>
  cy.screenshot(`map-export-${name}`, { capture: 'viewport', overwrite: true });

describe('Export all public entrances in the map bounds', () => {
  beforeEach(() => cy.disableServiceWorker());

  ['gpx', 'kml', 'geojson'].forEach(format => {
    it(`exports a complete ${format} file including entrances hidden by map filters`, () => {
      cy.viewport(1280, 720);
      visitMap({ zoom: format === 'geojson' ? 10 : 13 });
      openExport();
      cy.get('[role="note"]').should(
        'contain.text',
        'Size, data quality and interest filters are ignored.'
      );
      cy.get(`input[value="${format}"]`).check();
      if (format === 'gpx') screenshot('desktop');
      cy.get('[data-testid="map-export-download"]').click();
      cy.wait('@export');
      cy.get('[data-testid="map-export-dialog"]').should('not.exist');
      cy.readFile(`cypress/downloads/${basename}.${format}`).should(
        'equal',
        FILES[format]
      );
      cy.get('.leaflet-container').should('have.focus');
    });
  });

  ['F10', 'ContextMenu'].forEach(key => {
    it(`opens from ${key}, preserving other context actions and restoring focus`, () => {
      cy.viewport(1280, 720);
      visitMap();
      cy.get('.leaflet-container').focus();
      cy.get('.leaflet-container').should('have.focus');
      cy.window().then(win => {
        // Use the application's native keyboard event without synthetic pointer
        // coordinates: this menu must anchor to the map centre.
        const event = new win.KeyboardEvent('keydown', {
          key,
          shiftKey: key === 'F10',
          bubbles: true,
          cancelable: true
        });
        win.document.querySelector('.leaflet-container').dispatchEvent(event);
        expect(event.defaultPrevented).to.equal(true);
      });
      cy.contains('[role="menuitem"]', 'Create an entrance here').should(
        'be.visible'
      );
      cy.get('[data-testid="map-export-action"]').click();
      cy.contains('button', 'Cancel').click();
      cy.get('.leaflet-container').should('have.focus');
    });
  });

  it('fits a narrow phone and landscape with translated labels and fixed full-width actions', () => {
    cy.viewport(360, 720);
    visitMap({ language: 'fr' });
    openExport();
    cy.get('[role="note"]').should(
      'contain.text',
      'Les filtres de taille, de qualité des données et d’intérêt sont ignorés.'
    );
    screenshot('mobile');
    cy.get('[data-testid="map-export-dialog"]').then(dialog => {
      const rect = dialog[0].getBoundingClientRect();
      expect(rect.width).to.equal(360);
      expect(rect.height).to.equal(720);
      expect(dialog[0].scrollWidth).to.be.at.most(360);
    });
    cy.viewport(740, 360);
    cy.get('[data-testid="map-export-download"]').should('be.visible');
    cy.get('[data-testid="map-export-dialog"] button').each(button => {
      expect(button[0].getBoundingClientRect().height).to.be.at.least(44);
    });
    screenshot('landscape');
    cy.contains('button', 'Annuler').click();
  });

  ['loading', 'empty', 'error'].forEach(status => {
    it(`explains the ${status} state on mobile`, () => {
      cy.viewport(360, 720);
      visitMap({ status });
      openExport();
      cy.get('[data-testid="map-export-download"]').click();
      if (status === 'loading')
        cy.contains('Preparing export…').should('be.visible');
      if (status === 'empty')
        cy.contains('No public entrances were found in this area.').should(
          'be.visible'
        );
      if (status === 'error')
        cy.contains('Unable to download the export. Please try again.').should(
          'be.visible'
        );
      if (status !== 'error')
        cy.get('[data-testid="map-export-download"]').should('be.disabled');
      screenshot(`mobile-${status}`);
      cy.contains('button', 'Cancel').click();
      if (status === 'loading') cy.then(() => releaseExport());
      cy.get('[data-testid="map-export-dialog"]').should('not.exist');
    });
  });

  it('allows export with entrances hidden and explains why export is disabled offline', () => {
    visitMap({ layer: false });
    cy.get('.leaflet-container').rightclick(80, 180);
    cy.get('[data-testid="map-export-action"]').should(
      'not.have.attr',
      'aria-disabled',
      'true'
    );
    visitMap({ offline: true });
    cy.get('.leaflet-container').rightclick(80, 180);
    cy.get('[data-testid="map-export-action"]')
      .should('have.attr', 'aria-disabled', 'true')
      .and('contain.text', 'Unavailable offline');
  });
});
