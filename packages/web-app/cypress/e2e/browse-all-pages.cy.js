describe('Simple pages loader to check all major pages load correctly', () => {
  Cypress.Commands.add('checkPageLoaded', () => {
    // Very simple check to know if the app crashed (blank page) or not
    // Generally, if an error occurs, the h1 tag is not populated and a blank page is displayed.

    // Increase timeout because some pages can take a long time to load
    // TODO: make these pages quicker to load and reduce this timeout
    cy.get('h1', { timeout: 15000 })
      .should('exist')
      .should('not.be.empty');
  });

  it('home page', () => {
    cy.visit('/');
    cy.checkPageLoaded();
  });

  it('advanced search page', () => {
    cy.visit('/search');
    cy.get('.MuiTabs-root');
    // There is no <h1> tag on the advanced search page so just click on the search tabs
    cy.get('.MuiTabs-flexContainer > :nth-child(2)').click();
    cy.get('.MuiTabs-flexContainer > :nth-child(3)').click();
    cy.get('.MuiTabs-flexContainer > :nth-child(4)').click();
  });

  it('map page', () => {
    cy.visit('/map');
    // There is no <h1> tag on the map page so check if the leaflet container is present instead
    cy.get('.leaflet-container');
  });

  it('entrance page', () => {
    cy.visit('/entrances/35120'); // Entrance with lot of data
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
    // Not perfect since the <h1> tag is used to display a "Loading data" message... To improve or change the page behaviour
    cy.checkPageLoaded();
    cy.visit('/documents/58048'); // Issue
    cy.checkPageLoaded();
    cy.visit('/documents/73936'); // Article
    cy.checkPageLoaded();
  });

  it('organization page', () => {
    cy.visit('/organizations/2');
    // Not perfect since the <h1> tag is used to display a "Loading data" message... To improve or change the page behaviour
    cy.checkPageLoaded();
  });

  it('country page', () => {
    cy.visit('/countries/FR');
    // Not perfect since the <h1> tag is used to display a "Loading data" message... To improve or change the page behaviour
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
    cy.get('h2', { timeout: 15000 }) // No <h1> on this page, check <h2> instead
      .should('exist')
      .should('not.be.empty');
  });
});
