describe('Page tabs on narrow screens', () => {
  it('keeps translated labels and nonzero badges inside the navigation', () => {
    cy.viewport(320, 740);
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/35120' },
      {
        body: {
          id: 35120,
          name: 'Responsive entrance',
          cave: { id: 1, name: 'Responsive cave', entrances: [{ id: 35120 }] },
          documents: Array.from({ length: 4 }, (_, index) => ({
            id: index + 1,
            title: `Responsive document ${index + 1}`,
            type: 'Article',
            authors: [],
            authorsOrganization: []
          })),
          locations: [],
          descriptions: [],
          riggings: [],
          histories: [],
          comments: Array.from({ length: 3 }, (_, index) => ({
            id: index + 1,
            title: `Responsive comment ${index + 1}`,
            body: 'Test comment',
            language: 'eng',
            isDeleted: false
          }))
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
        const navBounds = nav.getBoundingClientRect();
        expect(nav.children).to.have.length(4);
        const badges = nav.querySelectorAll('[data-testid^="page-tab-badge-"]');
        expect(badges).to.have.length(2);
        [...badges].forEach(badge => {
          const bounds = badge.getBoundingClientRect();
          expect(bounds.top).to.be.at.least(navBounds.top);
          expect(bounds.bottom).to.be.at.most(navBounds.bottom);
          expect(bounds.left).to.be.at.least(navBounds.left);
          expect(bounds.right).to.be.at.most(navBounds.right);
        });
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
