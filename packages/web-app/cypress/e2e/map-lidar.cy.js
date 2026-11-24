const LIDAR_LAYER = 'IGNF_LIDAR-HD_MNT_ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW';

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

      cy.visit(`/map/46.7,5.9,${zoom}`, {
        onBeforeLoad: win => {
          win.localStorage.setItem('selectedBaseLayer', 'OpenStreetMap Basic');
          win.localStorage.setItem(
            'selectedOverlays',
            JSON.stringify(['France - MNT LiDAR HD'])
          );
          win.localStorage.setItem('layerOpacity', '0.5');
        }
      });

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
});
