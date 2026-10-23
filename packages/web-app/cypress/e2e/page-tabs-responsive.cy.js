describe('Page tabs on narrow screens', () => {
  it('keeps translated labels readable and reserves space for a taller navigation', () => {
    cy.viewport(320, 740);
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/35120' },
      {
        body: {
          id: 35120,
          name: 'Responsive entrance',
          cave: { id: 1, name: 'Responsive cave', entrances: [{ id: 35120 }] },
          documents: [],
          locations: [],
          descriptions: [],
          riggings: [],
          histories: [],
          comments: []
        }
      }
    ).as('entrance');
    cy.loginAs({ groups: ['User', 'Moderator', 'Administrator'] });
    cy.visit('/entrances/35120', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'de')
    });
    cy.wait('@entrance', { requestTimeout: 30000 });

    [320, 390].forEach(width => {
      cy.viewport(width, 740);
      cy.get('[data-testid="page-bottom-navigation"]', {
        timeout: 30000
      }).should($nav => {
        const nav = $nav[0];
        expect(nav.children).to.have.length(4);
        [...nav.children].forEach(button => {
          const label = button.querySelector(
            '[data-testid^="page-tab-label-"]'
          );
          const bounds = button.getBoundingClientRect();
          const labelBounds = label.getBoundingClientRect();
          expect(parseFloat(getComputedStyle(label).fontSize)).to.equal(9);
          expect(labelBounds.left).to.be.at.least(bounds.left);
          expect(labelBounds.right).to.be.at.most(bounds.right + 1);
          expect(labelBounds.bottom).to.be.at.most(bounds.bottom + 1);
        });
      });
      cy.get('#page-tabpanel-0').should($panel => {
        const panel = $panel[0];
        const nav = panel.ownerDocument.querySelector(
          '[data-testid="page-bottom-navigation"]'
        );
        expect(
          parseFloat(getComputedStyle(panel).paddingBottom)
        ).to.be.at.least(nav.getBoundingClientRect().height);
      });
      cy.document().should(doc => {
        expect(doc.documentElement.scrollWidth).to.be.at.most(
          doc.documentElement.clientWidth
        );
      });
    });
    cy.get('#page-tab-1').click();
    cy.get('#page-tabpanel-1').should('be.visible');
    cy.get('[data-testid="page-tab-label-1"]').should($label => {
      expect(parseFloat(getComputedStyle($label[0]).fontSize)).to.equal(9);
    });
    cy.screenshot('page-tabs-translated-mobile', { capture: 'viewport' });

    cy.viewport(1280, 900);
    cy.get('[data-testid="page-bottom-navigation"]').should('not.exist');
    cy.get('#page-tab-1').should('have.attr', 'aria-selected', 'true');
  });
});
