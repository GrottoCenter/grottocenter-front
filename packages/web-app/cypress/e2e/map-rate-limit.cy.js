const warningText = 'Limite de consultation de la carte atteinte.';
const mapCalls = spy =>
  spy.getCalls().filter(call => String(call.args[0]).includes('/geoloc/'));
const panMap = () => {
  cy.get('[data-testid="map-container"]').children().first().focus();
  cy.get('[data-testid="map-container"]')
    .children()
    .first()
    .trigger('keydown', { keyCode: 39, which: 39, shiftKey: true });
};

describe('Map rate-limit warning', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
  });

  [false, true].forEach(isAuthenticated => {
    it(`guides a ${isAuthenticated ? 'signed-in user' : 'visitor'} and blocks new requests after panning`, () => {
      cy.viewport(isAuthenticated ? 1366 : 390, isAuthenticated ? 768 : 844);
      if (isAuthenticated) cy.loginAs();
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/geoloc/**' },
        { statusCode: 429, body: 'Too many requests' }
      );
      cy.visit('/map/45.5,6.5,13', {
        onBeforeLoad: win => {
          win.localStorage.setItem('selectedLanguage', 'fr');
          cy.spy(win, 'fetch').as('networkFetch');
        }
      });
      cy.contains('[data-testid="app-snackbar"]', warningText, {
        timeout: 20000
      }).should('contain.text', 'plus tard.');
      cy.get('[data-testid="app-snackbar"]').should('have.length', 1);
      let beforePan;
      cy.get('@networkFetch').then(spy => {
        // Count at fetch invocation: responses already in flight can still
        // arrive after the first 429 and must not be mistaken for new calls.
        beforePan = mapCalls(spy).length;
      });
      panMap();
      cy.window().should(win => {
        const saved = JSON.parse(
          win.localStorage.getItem('grottocenter_map_position')
        );
        expect(saved).not.to.eq(null);
        expect(saved.lng).not.to.eq(6.5);
      });
      cy.get('@networkFetch').should(spy =>
        expect(mapCalls(spy)).to.have.length(beforePan)
      );
      if (isAuthenticated) {
        cy.get('[data-testid="map-rate-limit-login"]').should('not.exist');
      } else {
        cy.get('[data-testid="map-rate-limit-login"]').click();
        cy.get('[role="dialog"]').should('be.visible');
        cy.location('pathname').should('include', '/map/');
      }
    });
  });

  it('resumes bulk loads and dismisses the warning when the cooldown expires', () => {
    let hasResumed = false;
    cy.intercept({ method: 'GET', pathname: '/api/v1/geoloc/**' }, req => {
      if (new URL(req.url).pathname.endsWith('/entrancesCoordinates'))
        hasResumed = true;
      req.reply({ body: [] });
    });
    cy.intercept(
      {
        method: 'GET',
        pathname: '/api/v1/geoloc/entrancesCoordinates',
        times: 1
      },
      {
        statusCode: 429,
        body: 'Too many requests',
        headers: {
          'Retry-After': '5',
          'Access-Control-Expose-Headers': 'Retry-After'
        }
      }
    );
    cy.visit('/map/45.5,6.5,13', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'fr')
    });
    cy.contains('[data-testid="app-snackbar"]', warningText).should(
      'contain.text',
      'dans 1 minute.'
    );
    cy.contains('[data-testid="app-snackbar"]', warningText, {
      timeout: 12000
    }).should('not.exist');
    cy.wrap(null).should(() => expect(hasResumed).to.eq(true));
  });

  it('resumes map requests with the authenticated quota immediately after login', () => {
    let token;
    cy.loginAs();
    cy.then(() => {
      token = localStorage.getItem('grottocenter_token');
      localStorage.removeItem('grottocenter_token');
    });
    cy.intercept({ method: 'POST', pathname: '/api/v1/login' }, req => {
      req.reply({ body: { token } });
    });
    cy.intercept({ method: 'GET', pathname: '/api/v1/geoloc/**' }, req => {
      if (req.headers.authorization) {
        expect(req.headers.authorization).to.eq(`Bearer ${token}`);
        if (new URL(req.url).pathname.endsWith('/entrancesCoordinates'))
          req.alias = 'authenticatedCoordinates';
        req.reply({ body: [] });
      } else req.reply({ statusCode: 429, body: 'Too many requests' });
    });
    cy.visit('/map/45.5,6.5,13', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'fr')
    });
    cy.get('[data-testid="map-rate-limit-login"]').click();
    cy.get('#login-email').type('test@example.com');
    cy.get('#login-password').type('password{enter}');
    cy.wait('@authenticatedCoordinates');
    cy.contains('[data-testid="app-snackbar"]', warningText).should(
      'not.exist'
    );
    cy.location('pathname').should('include', '/map/');
  });
});

const describeWithServiceWorker = Cypress.expose('serviceWorker')
  ? describe
  : describe.skip;

describeWithServiceWorker('Map background rate limit', () => {
  it('preserves a cached response, pauses page requests and detects a new 429 after reload', () => {
    cy.then(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(item => item.unregister()));
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
    });
    cy.mockApiCatchAll();
    let apiOrigin;
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/**' },
      { body: [] }
    ).as('coordinates');
    cy.visit('/map/45.5,6.5,13', {
      onBeforeLoad: win => {
        win.localStorage.setItem('selectedLanguage', 'fr');
        cy.spy(win, 'fetch').as('networkFetch');
      }
    });
    cy.wait('@coordinates').then(({ request }) => {
      apiOrigin = new URL(request.url).origin;
    });
    cy.window().then({ timeout: 60000 }, async win => {
      await win.navigator.serviceWorker.ready;
      if (!win.navigator.serviceWorker.controller) {
        await new Promise(resolve => {
          win.navigator.serviceWorker.addEventListener(
            'controllerchange',
            resolve,
            { once: true }
          );
        });
      }
      const url = `${apiOrigin}/api/v1/geoloc/entrancesCoordinates?rateLimitTest=1`;
      const cache = await win.caches.open('api-map-coords-daily');
      await cache.put(
        url,
        new win.Response('[]', {
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
    let requests = 0;
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/entrancesCoordinates' },
      req => {
        requests += 1;
        req.reply({ statusCode: 429, body: 'Too many requests' });
      }
    ).as('background429');
    cy.window().then(async win => {
      const response = await win.fetch(
        `${apiOrigin}/api/v1/geoloc/entrancesCoordinates?rateLimitTest=1`
      );
      expect(response.status).to.eq(200);
      expect(await response.json()).to.deep.eq([]);
    });
    cy.wait('@background429');
    cy.contains('[data-testid="app-snackbar"]', warningText).should(
      'be.visible'
    );
    cy.get('[data-testid="app-snackbar"]').should('have.length', 1);
    let beforePan;
    cy.get('@networkFetch').then(spy => {
      beforePan = mapCalls(spy).length;
    });
    panMap();
    cy.window().should(win => {
      const saved = JSON.parse(
        win.localStorage.getItem('grottocenter_map_position')
      );
      expect(saved.lng).not.to.eq(6.5);
    });
    cy.get('@networkFetch').should(spy =>
      expect(mapCalls(spy)).to.have.length(beforePan)
    );
    cy.then(() => expect(requests).to.eq(1));
    // Each document owns its pause. A reload detects its own background 429.
    cy.reload();
    cy.contains('[data-testid="app-snackbar"]', warningText).should(
      'be.visible'
    );
    cy.wrap(null).should(() => expect(requests).to.be.at.least(2));
  });
});
