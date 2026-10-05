describe('All major pages render their shell without crashing', () => {
  // Intercept every API call so this suite can't leak traffic to the
  // production API from CI (see issue #1554). The catch-all returns {},
  // which is enough for this smoke test: `checkPageLoaded` only asserts
  // that the page shell rendered an h1 — PageTitle shows a Skeleton while
  // data is missing, which keeps h1 non-empty.
  beforeEach(() => {
    cy.mockApiCatchAll();
  });

  it('home page', () => {
    cy.visit('/');
    cy.checkPageLoaded();
  });

  it('recent changes page', () => {
    cy.visit('/changes/recent');
    cy.checkPageLoaded();
  });

  it('entrances list page', () => {
    cy.visit('/entrances');
    cy.checkPageLoaded();
  });

  it('massifs list page', () => {
    cy.visit('/massifs');
    cy.checkPageLoaded();
  });

  it('organizations list page', () => {
    cy.visit('/organizations');
    cy.checkPageLoaded();
  });

  it('documents list page', () => {
    cy.visit('/documents');
    cy.checkPageLoaded();
  });

  it('persons list page', () => {
    cy.visit('/persons');
    cy.checkPageLoaded();
  });

  it('map page', () => {
    cy.visit('/map');
    // There is no <h1> tag on the map page so check if the leaflet container is present instead
    cy.get('.leaflet-container');
  });

  it('entrance page', () => {
    cy.visit('/entrances/35120');
    cy.checkPageLoaded();
  });

  it('cave page', () => {
    cy.visit('/caves/75363');
    cy.checkPageLoaded();
  });

  it('massif page', () => {
    cy.visit('/massifs/490');
    cy.checkPageLoaded();
  });

  it('document page', () => {
    cy.visit('/documents/22695');
    cy.checkPageLoaded();
  });

  it('organization page', () => {
    cy.visit('/organizations/2');
    // TODO: make these pages quicker to load and reduce this timeout
    cy.checkPageLoaded({ timeout: 35000 });
  });

  it('country page', () => {
    cy.visit('/countries/FR');
    cy.checkPageLoaded();
  });

  it('region page', () => {
    // Region's PageTitle renders '' (empty h1) when the fetched region has no
    // name — the catch-all's `{}` triggers that branch. Return a minimal shape
    // with a name so the h1 is non-empty.
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/countries/US/regions/TN' },
      { statusCode: 200, body: { id: 'TN', name: 'Tennessee' } }
    );
    cy.visit('/countries/US/regions/TN');
    cy.checkPageLoaded();
  });

  it('person page', () => {
    cy.visit('/persons/1');
    cy.checkPageLoaded();
  });

  it('api page', () => {
    // SwaggerUI fetches swagger.yaml to render the spec. The catch-all mock
    // above returns `{}`, which SwaggerUI parses as an empty spec and never
    // produces an `.info .title`. Override with a minimal valid OpenAPI
    // document so the UI has something to render.
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/swagger.yaml' },
      {
        statusCode: 200,
        headers: { 'content-type': 'application/yaml' },
        body: `openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths: {}
`
      }
    );
    cy.visit('/api');
    cy.checkPageLoaded();
    cy.visit('/api/1');
    // Wait for SwaggerUI to fully load and render
    cy.get('.swagger-ui', { timeout: 30000 }).should('be.visible');
    // Check for the title (h1 or h2 depending on SwaggerUI version)
    cy.get('.swagger-ui .info .title', { timeout: 15000 })
      .should('exist')
      .should('not.be.empty');
  });
});
