describe('Simple pages loader to check all major pages load correctly', () => {
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
    cy.visit('/entrances/35120'); // Entrance with a lot of data
    cy.checkPageLoaded();

    cy.visit('/entrances/6085'); // Entrance with almost no data
    cy.checkPageLoaded();
  });

  it('cave page', () => {
    cy.visit('/caves/75363'); // Cave with lot of entrances
    cy.checkPageLoaded();

    cy.visit('/caves/6085'); // Cave with almost no data
    cy.checkPageLoaded();
  });

  it('massif page', () => {
    cy.visit('/massifs/490');
    cy.checkPageLoaded();
  });

  it('document page', () => {
    cy.visit('/documents/22695'); // Collection
    cy.checkPageLoaded();
    cy.visit('/documents/58048'); // Issue
    cy.checkPageLoaded();
    cy.visit('/documents/73936'); // Article
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
    cy.visit('/countries/US/regions/TN');
    cy.checkPageLoaded();
  });

  it('person page', () => {
    cy.visit('/persons/1');
    cy.checkPageLoaded();
  });

  it('api page', () => {
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
