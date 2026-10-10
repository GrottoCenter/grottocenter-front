describe('Automatic rigging equipment estimates', () => {
  beforeEach(() => {
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/42' },
      {
        body: {
          id: 42,
          name: 'Equipment test entrance',
          isDeleted: false,
          documents: [],
          massifs: [],
          locations: [],
          descriptions: [],
          histories: [],
          comments: [],
          riggings: [
            {
              id: 1,
              title: 'French notation',
              language: 'fra',
              isDeleted: false,
              obstacles: [
                {
                  obstacle: 'P10',
                  rope: 'C30',
                  anchor: '2AF ou 2S',
                  observation: '99S'
                },
                {
                  obstacle: 'P20',
                  rope: 'C20',
                  anchor: '3 mouskifs + 2AS',
                  observation: ''
                },
                { obstacle: 'P5', rope: '', anchor: '1dev/G', observation: '' }
              ]
            },
            {
              id: 2,
              title: 'English notation',
              language: 'eng',
              isDeleted: false,
              obstacles: [
                {
                  obstacle: 'P10',
                  rope: 'C15',
                  anchor: 'three EB + one NA',
                  observation: ''
                }
              ]
            }
          ]
        }
      }
    );
  });

  it('shows approximate counts and ranges for each sheet in an English interface', () => {
    cy.visit('/entrances/42', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.get('[data-testid="rigging-summary"]').should('have.length', 2);
    cy.get('[data-testid="rigging-summary"]')
      .first()
      .within(() => {
        cy.contains('50 m');
        cy.get('[data-testid="rigging-equipment-hangers"]').should(
          'have.text',
          '~1–3 bolt hangers'
        );
        cy.get('[data-testid="rigging-equipment-carabiners"]').should(
          'have.text',
          '~4–6 carabiners'
        );
        cy.get('[data-testid="rigging-equipment-expansionBolts"]').should(
          'have.text',
          '~1 expansion bolts'
        );
        cy.get('[data-testid="rigging-equipment-softAnchors"]').should(
          'have.text',
          '~2 soft anchors (SA)'
        );
        cy.get('[data-testid="rigging-equipment-slings"]').should(
          'have.text',
          '~1–3 accessory cords'
        );
      });
    cy.get('[data-testid="rigging-summary"]')
      .last()
      .within(() => {
        cy.contains('15 m');
        cy.get('[data-testid="rigging-equipment-carabiners"]').should(
          'have.text',
          '~3 carabiners'
        );
        cy.get('[data-testid="rigging-equipment-expansionBolts"]').should(
          'have.text',
          '~3 expansion bolts'
        );
        cy.get('[data-testid="rigging-equipment-slings"]').should(
          'have.text',
          '~1 accessory cords'
        );
        cy.get('[data-testid="rigging-equipment-hangers"]').should(
          'have.text',
          '~3 bolt hangers'
        );
      });
    cy.viewport(390, 844);
    cy.get('[data-testid="rigging-summary"]').first().scrollIntoView();
    cy.get('[data-testid="rigging-equipment-softAnchors"]')
      .first()
      .should('be.visible');
    cy.document().should(doc => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(
        doc.documentElement.clientWidth
      );
    });
  });

  it('shows quantities first and spells out soft anchors in the French tooltip', () => {
    cy.visit('/entrances/42', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'fr')
    });
    cy.get('[data-testid="rigging-equipment-hangers"]')
      .first()
      .should('have.text', '~1–3 plaquettes');
    cy.get('[data-testid="rigging-equipment-slings"]')
      .first()
      .should('have.text', '~1–3 cordelettes');
    cy.get('[data-testid="rigging-equipment-softAnchors"]')
      .first()
      .should('have.text', '~2 AS')
      .trigger('mouseover');
    cy.get('[role="tooltip"]').should(
      'have.text',
      'Quantité approximative d’amarrages souples, depuis les cases Ancrages'
    );
  });
});
