const LIDAR_LAYER = 'IGNF_LIDAR-HD_MNT_ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW';

const visitMap = (
  position = '46.7,5.9,14',
  overlayName = 'France - MNT LiDAR HD'
) => {
  cy.visit(`/map/${position}`, {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedBaseLayer', 'OpenStreetMap Basic');
      win.localStorage.setItem(
        'selectedOverlays',
        JSON.stringify([overlayName])
      );
      win.localStorage.setItem('layerOpacity', '0.5');
    }
  });
};

const expectLoadedTile = tile => {
  expect(tile.complete).to.eq(true);
  expect(tile.naturalWidth).to.be.greaterThan(0);
  // A decoded fallback must also complete Leaflet's loading lifecycle.
  expect(tile.classList.contains('leaflet-tile-loaded')).to.eq(true);
};

const expectTransparentTile = tile => {
  expectLoadedTile(tile);
  expect(tile.src).to.match(/^data:image\//);
  expect(tile.src).not.to.match(/^data:image\/svg\+xml/);

  const canvas = tile.ownerDocument.createElement('canvas');
  canvas.width = tile.naturalWidth;
  canvas.height = tile.naturalHeight;
  const context = canvas.getContext('2d');
  context.drawImage(tile, 0, 0);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const alpha = data.filter((_value, index) => index % 4 === 3);
  expect(Array.from(alpha).every(value => value === 0)).to.eq(true);
};

const expectLoadedBasemap = () => {
  cy.get('[data-testid="map-container"] img[src*="tile.openstreetmap.org"]')
    .should('be.visible')
    .should(tiles => {
      tiles.toArray().forEach(expectLoadedTile);
    });
};

describe('LiDAR WMTS overlay', () => {
  beforeEach(() => {
    cy.intercept('GET', 'https://fonts.googleapis.com/**', {
      body: '',
      headers: { 'Content-Type': 'text/css' }
    });
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/**' },
      { body: [] }
    );
    cy.intercept('GET', 'https://tile.openstreetmap.org/**', {
      fixture: 'entrance-map-tile.png',
      headers: { 'Content-Type': 'image/png' }
    });
  });

  [14, 18, 22].forEach(zoom => {
    it(`loads WMTS tiles at map zoom ${zoom} without exceeding matrix 18`, () => {
      const wmsRequests = [];
      cy.intercept(
        { method: 'GET', hostname: 'data.geopf.fr', pathname: '/wms-r/wms' },
        req => {
          wmsRequests.push(req.url);
          req.reply({ statusCode: 500 });
        }
      );
      cy.intercept(
        { method: 'GET', hostname: 'data.geopf.fr', pathname: '/wmts' },
        req => {
          const { searchParams } = new URL(req.url);
          expect(searchParams.get('SERVICE')).to.eq('WMTS');
          expect(searchParams.get('REQUEST')).to.eq('GetTile');
          expect(searchParams.get('LAYER')).to.eq(LIDAR_LAYER);
          expect(searchParams.get('STYLE')).to.eq('normal');
          expect(searchParams.get('FORMAT')).to.eq('image/png');
          expect(searchParams.get('TILEMATRIXSET')).to.eq('PM_0_18');
          expect(Number(searchParams.get('TILEMATRIX'))).to.eq(
            Math.min(zoom, 18)
          );
          req.reply({
            fixture: 'entrance-map-tile.png',
            headers: { 'Content-Type': 'image/png' }
          });
        }
      ).as('lidarTile');

      visitMap(`46.7,5.9,${zoom}`);

      cy.wait('@lidarTile', { requestTimeout: 20000 });
      cy.get('[data-testid="map-container"] img[src*="data.geopf.fr/wmts"]')
        .should('be.visible')
        .should(tiles => {
          expect(tiles.length).to.be.greaterThan(0);
          tiles.toArray().forEach(tile => {
            expect(tile.complete).to.eq(true);
            expect(tile.naturalWidth).to.be.greaterThan(0);
          });
        });
      cy.window().should(win => {
        const position = JSON.parse(
          win.localStorage.getItem('grottocenter_map_position')
        );
        expect(position.zoom).to.eq(zoom);
        expect(wmsRequests).to.have.length(0);
      });
    });
  });

  [
    {
      type: 'WMTS',
      overlayName: 'France - MNT LiDAR HD',
      hostname: 'data.geopf.fr',
      pathname: '/wmts',
      statusCode: 404
    },
    {
      type: 'WMS',
      overlayName: 'USA - USGS Hillshade',
      hostname: 'elevation.nationalmap.gov',
      pathname: '/arcgis/services/3DEPElevation/ImageServer/WMSServer',
      statusCode: 503
    }
  ].forEach(({ type, overlayName, hostname, pathname, statusCode }) => {
    it(`keeps failed ${type} overlay tiles transparent and loaded`, () => {
      cy.intercept(
        { method: 'GET', hostname, pathname },
        { statusCode, body: 'No data found' }
      ).as('missingOverlayTile');

      visitMap('46.7,5.9,14', overlayName);

      cy.wait('@missingOverlayTile', { requestTimeout: 20000 });
      // Leaflet creates these panes outside React, without test IDs.
      cy.get('[data-testid="map-container"] .leaflet-hillshade-pane img')
        .should('have.length.greaterThan', 0)
        .should(tiles => {
          tiles.toArray().forEach(expectTransparentTile);
        });
      expectLoadedBasemap();
    });
  });

  it('renders a LiDAR coverage gap beside loaded tiles in France', () => {
    cy.intercept(
      { method: 'GET', hostname: 'data.geopf.fr', pathname: '/wmts' },
      req => {
        const { searchParams } = new URL(req.url);
        if (Number(searchParams.get('TILECOL')) % 2 === 0) {
          req.reply({ statusCode: 404, body: 'No data found' });
          return;
        }
        req.reply({
          fixture: 'entrance-map-tile.png',
          headers: { 'Content-Type': 'image/png' }
        });
      }
    ).as('lidarTile');

    visitMap();

    cy.wait('@lidarTile', { requestTimeout: 20000 });
    // Check the same Leaflet pane contains both real tiles and transparent gaps.
    cy.get('[data-testid="map-container"] .leaflet-hillshade-pane img').should(
      tiles => {
        const missingTiles = tiles
          .toArray()
          .filter(tile => tile.src.startsWith('data:image/'));
        const loadedTiles = tiles
          .toArray()
          .filter(tile => tile.src.includes('data.geopf.fr/wmts'));
        expect(missingTiles.length).to.be.greaterThan(0);
        expect(loadedTiles.length).to.be.greaterThan(0);
        missingTiles.forEach(expectTransparentTile);
        loadedTiles.forEach(expectLoadedTile);
      }
    );
    expectLoadedBasemap();
  });

  it('preserves the grey fallback for missing basemap tiles', () => {
    cy.intercept('GET', 'https://tile.openstreetmap.org/**', {
      statusCode: 404,
      body: 'No data found'
    }).as('missingBasemapTile');
    cy.intercept(
      { method: 'GET', hostname: 'data.geopf.fr', pathname: '/wmts' },
      {
        fixture: 'entrance-map-tile.png',
        headers: { 'Content-Type': 'image/png' }
      }
    );

    visitMap();

    cy.wait('@missingBasemapTile', { requestTimeout: 20000 });
    // Inspect Leaflet's basemap pane, excluding SVG icons in map controls.
    cy.get('[data-testid="map-container"] .leaflet-basemap-pane img')
      .should('be.visible')
      .should(tiles => {
        tiles.toArray().forEach(tile => {
          expect(tile.src).to.match(/^data:image\/svg\+xml/);
          expect(decodeURIComponent(tile.src)).to.include('fill="#f5f5f5"');
          expect(tile.complete).to.eq(true);
          expect(tile.naturalWidth).to.be.greaterThan(0);
        });
      });
  });
});
