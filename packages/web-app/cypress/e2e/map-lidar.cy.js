const LIDAR_LAYER = 'IGNF_LIDAR-HD_MNT_ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW';

const visitMap = (position = '46.7,5.9,14') => {
  cy.visit(`/map/${position}`, {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedBaseLayer', 'OpenStreetMap Basic');
      win.localStorage.setItem(
        'selectedOverlays',
        JSON.stringify(['France - MNT LiDAR HD'])
      );
      win.localStorage.setItem('layerOpacity', '0.5');
    }
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

  ['46.7,5.9,14', '52.52,13.405,14'].forEach(position => {
    it(`keeps missing overlay tiles transparent at ${position}`, () => {
      cy.intercept(
        { method: 'GET', hostname: 'data.geopf.fr', pathname: '/wmts' },
        { statusCode: 404, body: 'No data found' }
      ).as('missingLidarTile');

      visitMap(position);

      cy.wait('@missingLidarTile', { requestTimeout: 20000 });
      // Leaflet creates these panes outside React, without test IDs.
      cy.get('[data-testid="map-container"] .leaflet-hillshade-pane img')
        .should('have.length.greaterThan', 0)
        .should(tiles => {
          tiles.toArray().forEach(tile => {
            expect(tile.src).to.match(/^data:image\//);
            expect(tile.src).not.to.match(/^data:image\/svg\+xml/);
            expect(tile.complete).to.eq(true);
            expect(tile.naturalWidth).to.be.greaterThan(0);

            const canvas = tile.ownerDocument.createElement('canvas');
            canvas.width = tile.naturalWidth;
            canvas.height = tile.naturalHeight;
            const context = canvas.getContext('2d');
            context.drawImage(tile, 0, 0);
            const { data } = context.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const alpha = data.filter((_value, index) => index % 4 === 3);
            expect(Array.from(alpha).every(value => value === 0)).to.eq(true);
          });
        });
      cy.get('[data-testid="map-container"] img[src*="tile.openstreetmap.org"]')
        .should('be.visible')
        .should(tiles => {
          tiles.toArray().forEach(tile => {
            expect(tile.complete).to.eq(true);
            expect(tile.naturalWidth).to.be.greaterThan(0);
          });
        });
    });
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
