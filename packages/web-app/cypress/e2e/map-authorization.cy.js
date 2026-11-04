describe('Map API authorization', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
  });

  it('clears a rejected session and allows anonymous map browsing after logout', () => {
    cy.loginAs();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/**' },
      { body: [] }
    );
    cy.intercept(
      {
        method: 'GET',
        pathname: '/api/v1/geoloc/entrancesCoordinates',
        times: 1
      },
      req => {
        expect(req.headers.authorization).to.match(/^Bearer /);
        req.reply({
          statusCode: 401,
          body: { message: 'Token has been revoked.' }
        });
      }
    ).as('rejectedMapSession');

    cy.visit('/map/45.5,6.5,13');
    cy.wait('@rejectedMapSession');
    cy.location('pathname').should('eq', '/');
    cy.window().should(win => {
      expect(win.localStorage.getItem('grottocenter_token')).to.eq(null);
    });

    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/entrancesCoordinates' },
      req => {
        expect(req.headers.authorization).to.eq(undefined);
        req.reply({ body: [] });
      }
    ).as('anonymousCoordinates');
    cy.visit('/map/45.5,6.5,13');
    cy.wait('@anonymousCoordinates');
  });

  [false, true].forEach(isAuthenticated => {
    it(`sends ${isAuthenticated ? 'the session bearer' : 'no bearer'} on map requests`, () => {
      let authorization;
      if (isAuthenticated) cy.loginAs();
      cy.then(() => {
        if (isAuthenticated) {
          authorization = `Bearer ${localStorage.getItem('grottocenter_token')}`;
        } else localStorage.removeItem('grottocenter_token');
      });
      cy.intercept({ method: 'GET', pathname: '/api/v1/geoloc/**' }, req => {
        expect(req.headers.authorization).to.eq(authorization);
        const name = req.url.match(/\/geoloc\/([^?]+)/)[1];
        req.alias =
          name === 'organizations' && req.query.sw_lat === '-90'
            ? 'organizationCoordinates'
            : name;
        req.reply({ body: [] });
      });
      cy.visit('/map/45.5,6.5,13', {
        onBeforeLoad: win => {
          win.localStorage.setItem(
            'grottocenter_selectedLayers',
            JSON.stringify({
              entrances: true,
              networks: true,
              organizations: true,
              massifs: true
            })
          );
        }
      });
      cy.wait([
        '@entrancesCoordinates',
        '@networksCoordinates',
        '@massifsCoordinates',
        '@organizationCoordinates',
        '@entrances',
        '@networks',
        '@organizations',
        '@massifs'
      ]);
    });
  });
});
