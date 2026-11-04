// Run against a production preview with --expose serviceWorker=true.
// Development and e2e-mode builds deliberately do not register a worker.
const describeWithServiceWorker = Cypress.expose('serviceWorker')
  ? describe
  : describe.skip;

// Workbox writes to Cache Storage after delivering the network response.
const waitForCache = (win, name, predicate, deadline = Date.now() + 5000) =>
  win.caches
    .open(name)
    .then(cache => cache.keys())
    .then(requests => {
      if (predicate(requests)) return requests;
      if (Date.now() >= deadline)
        throw new Error(`Cache ${name} was not written`);
      return Cypress.Promise.delay(50).then(() =>
        waitForCache(win, name, predicate, deadline)
      );
    });

describeWithServiceWorker('Map detail offline cache isolation', () => {
  it('keeps session-specific details and public coordinates available on network failure', () => {
    let apiOrigin;
    const id = 987654321;
    cy.then(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(item => item.unregister()));
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
    });
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/**' },
      { body: [] }
    ).as('coordinates');
    cy.intercept(
      { method: 'GET', pathname: `/api/v1/entrances/${id}` },
      req => {
        req.reply({
          headers: { 'Cache-Control': 'no-store' },
          body: { name: req.headers.authorization || 'public' }
        });
      }
    );
    cy.visit('/map/45.5,6.5,10');
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
    });
    const fetchDetail = token =>
      cy.window().then(win =>
        win
          .fetch(`${apiOrigin}/api/v1/entrances/${id}`, {
            headers: token ? { Authorization: token } : {}
          })
          .then(response => response.json())
      );

    fetchDetail('Bearer offline-a')
      .its('name')
      .should('eq', 'Bearer offline-a');
    fetchDetail('Bearer offline-b')
      .its('name')
      .should('eq', 'Bearer offline-b');
    fetchDetail().its('name').should('eq', 'public');
    cy.window().then(win =>
      waitForCache(
        win,
        'api-get',
        requests =>
          requests.filter(request => request.url.includes(`/${id}?`)).length ===
          3
      )
    );

    const coordinatesUrl = () =>
      `${apiOrigin}/api/v1/geoloc/entrancesCoordinates?offlineAuthTest=1`;
    cy.window().then(win =>
      win.fetch(coordinatesUrl(), {
        headers: { Authorization: 'Bearer offline-a' }
      })
    );
    cy.window().then(win =>
      waitForCache(win, 'api-map-coords-daily', requests =>
        requests.some(request => request.url === coordinatesUrl())
      )
    );
    cy.intercept(
      { method: 'GET', pathname: `/api/v1/entrances/${id}` },
      { forceNetworkError: true }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/entrancesCoordinates' },
      { forceNetworkError: true }
    );
    fetchDetail('Bearer offline-a')
      .its('name')
      .should('eq', 'Bearer offline-a');
    fetchDetail('Bearer offline-b')
      .its('name')
      .should('eq', 'Bearer offline-b');
    fetchDetail().its('name').should('eq', 'public');
    cy.window().then(async win => {
      const response = await win.fetch(coordinatesUrl(), {
        headers: { Authorization: 'Bearer offline-b' }
      });
      expect(await response.json()).to.deep.eq([]);
      let hasFailed = false;
      try {
        await win.fetch(`${apiOrigin}/api/v1/entrances/${id}`, {
          headers: { Authorization: 'Bearer uncached-session' }
        });
      } catch {
        hasFailed = true;
      }
      expect(hasFailed).to.eq(true);
    });
  });
});
