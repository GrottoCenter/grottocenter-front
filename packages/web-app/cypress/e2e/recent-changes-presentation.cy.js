const subtitle =
  'Dernières contributions concernant ce massif sur les 7 derniers jours (dans la limite des 500 dernières contributions).';
const massifName = 'Bauges (massif des)';

describe('French recent-changes presentation', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept('GET', '**/api/v1/massifs/42', {
      body: { id: 42, name: massifName, descriptions: [] }
    });
    cy.intercept('GET', '**/api/v1/changes/recent*', {
      body: {
        changes: [
          {
            date: new Date().toISOString(),
            authorId: 1,
            author: 'Chloé',
            mainEntityType: 'entrance',
            mainEntityId: 7,
            mainAction: 'update',
            subEntityTypes: [],
            name: 'Entrée de la forêt'
          }
        ]
      }
    }).as('changes');
  });

  [
    [1280, 900],
    [390, 844]
  ].forEach(([width, height]) => {
    it(`shows one gray subtitle and a named massif page at ${width}px`, () => {
      cy.viewport(width, height);
      cy.visit('/massifs/42?tab=activities', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'fr')
      });
      cy.wait('@changes', { requestTimeout: 30000 });
      cy.get('h1').should('have.text', massifName);
      cy.get('[data-testid="see-all-recent-changes"]').should('not.exist');
      cy.get('#activities').scrollIntoView();
      cy.contains(
        'Découvrez les chiffres clés concernant ce massif et ses cavités.'
      ).then($reference => {
        cy.contains(subtitle).should(
          'have.css',
          'color',
          $reference.css('color')
        );
        cy.contains(subtitle).should(
          'have.css',
          'font-size',
          $reference.css('font-size')
        );
        cy.contains(subtitle).should(
          'have.css',
          'font-weight',
          $reference.css('font-weight')
        );
      });
      cy.get('#activities').within(() => {
        cy.contains(subtitle).should(
          'have.css',
          'color',
          'rgba(0, 0, 0, 0.75)'
        );
        cy.contains('Entrée de la forêt').should('be.visible');
        cy.get('h2').should('have.text', 'Activités');
        cy.get('[data-testid="activity-tab-icon"]').should('not.exist');
      });
      cy.get(
        '[data-testid="page-tab-activities"] [data-testid="activity-tab-icon"]'
      ).should('exist');
    });
  });
});
