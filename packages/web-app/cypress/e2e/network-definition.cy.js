const network = {
  id: 2,
  name: 'Test network',
  language: 'eng',
  depth: 30,
  length: 200,
  entrances: [
    { id: 1, name: 'First entrance', latitude: 45, longitude: 5 },
    { id: 3, name: 'Second entrance', latitude: 45.001, longitude: 5.001 }
  ],
  massifs: [],
  descriptions: [],
  documents: [],
  exploringOrganizations: []
};

const entrance = {
  ...network.entrances[0],
  language: 'eng',
  isSensitive: false,
  cave: network,
  massifs: [],
  descriptions: [],
  documents: [],
  comments: [],
  histories: [],
  locations: [],
  riggings: []
};

const visit = path =>
  cy.visit(path, {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', 'en');
    }
  });

const assertDefinition = () => {
  cy.get('[data-testid="network-definition"]').should('be.visible');
  cy.get('[data-testid="network-definition"] strong')
    .should('have.length', 2)
    .first()
    .should('have.text', 'at least two entrances');
  cy.get('[data-testid="network-definition"]')
    .should('contain.text', 'established by human exploration')
    .and('contain.text', 'A hydrological connection');
};

describe('Network definition', () => {
  beforeEach(() => {
    cy.mockApiCatchAll();
    cy.intercept('GET', '**/api/v1/languages', {
      body: [{ id: 'eng', refName: 'English' }]
    });
    cy.intercept('GET', '**/api/v1/entrances/1', entrance);
    cy.intercept('GET', '**/api/v1/caves/2', network);
    cy.intercept('GET', '**/api/v1/geoloc/entrances*', { body: [] });
    cy.loginAs();
  });

  [1280, 390].forEach(width => {
    ['/entity/add/entrance', '/caves/2', '/entrances/1/edit'].forEach(path => {
      it(`opens and closes the definition on ${path} at ${width}px`, () => {
        cy.viewport(width, 900);
        visit(path);
        cy.get('[data-testid="network-definition-help"]').as('help');
        cy.get('[data-testid="network-definition"]').should('not.exist');
        if (path === '/entity/add/entrance') {
          cy.get('[data-testid="network-link-checkbox"]')
            .should('not.be.checked')
            .check();
          cy.get('[data-testid="network-definition"]').should('not.exist');
        }
        cy.get('@help').click();
        cy.contains('[role="dialog"]', 'What is a network?')
          .as('definitionDialog')
          .should('be.visible');
        assertDefinition();
        cy.get('@definitionDialog').type('{esc}');
        cy.contains('[role="dialog"]', 'What is a network?').should(
          'not.exist'
        );
        cy.get('[data-testid="network-definition"]').should('not.exist');
        cy.get('@help').should('be.focused');
        cy.location('pathname').should('eq', `/ui${path}`);
      });
    });

    it(`shows the definition directly below the attachment title at ${width}px`, () => {
      cy.viewport(width, 900);
      visit('/entrances/1/move');
      cy.get('h1').should('have.text', 'Attach the entrance');
      cy.get('[data-testid="network-definition-help"]').should('not.exist');
      assertDefinition();
      cy.get('h1').then($heading => {
        const headingBounds = $heading[0].getBoundingClientRect();
        cy.get('[data-testid="network-definition"]').should($definition => {
          const bounds = $definition[0].getBoundingClientRect();
          expect(bounds.top).to.be.at.least(headingBounds.bottom);
          expect(bounds.left).to.be.closeTo(headingBounds.left, 1);
        });
      });
      // Capture the page after its initial opacity transition has finished.
      cy.get('#root').should('have.css', 'opacity', '1');
      cy.screenshot(`network-definition-attachment-${width}`, {
        capture: 'viewport',
        disableTimersAndAnimations: false
      });
    });

    it(`keeps the definition off the detach page at ${width}px`, () => {
      cy.viewport(width, 900);
      visit('/entrances/1/move?mode=detach');
      cy.get('h1').should('have.text', 'Detach the entrance');
      cy.get('[data-testid="network-definition"]').should('not.exist');
      cy.get('[data-testid="network-definition-help"]').should('not.exist');
    });
  });
});
