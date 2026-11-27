const roles = ['Administrator', 'Moderator', 'Leader', 'User', 'Visitor'];

const visit = path =>
  cy.visit(path, {
    onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'fr')
  });

const expectRoleIcon = role => {
  cy.get(`[data-testid="role-chip-${role}"]`)
    .should('be.visible')
    .find('svg')
    .should('have.attr', 'aria-hidden', 'true');
};

describe('Shared role chips', () => {
  beforeEach(() => {
    cy.mockApiCatchAll();
    cy.loginAs({ groups: roles });
  });

  [1280, 390].forEach(width => {
    it(`shows separate role chips on dashboard cards at ${width}px`, () => {
      cy.viewport(width, 900);
      visit('/dashboard');
      cy.get('a[href="/ui/deleted-entities"]').within(() => {
        expectRoleIcon('Administrator');
        expectRoleIcon('Moderator');
        cy.get('[data-testid^="role-chip-"]').should($chips => {
          const [first, second] = [...$chips].map(chip =>
            chip.getBoundingClientRect()
          );
          expect(
            first.right <= second.left || first.bottom <= second.top,
            'role chips do not overlap'
          ).to.equal(true);
        });
      });
      cy.document().should(doc => {
        expect(doc.documentElement.scrollWidth).to.be.at.most(width);
      });
      cy.screenshot(`role-chips-dashboard-${width}`, { capture: 'fullPage' });
      cy.get('[data-testid="role-chip-Leader"]').scrollIntoView();
      cy.screenshot(`role-chips-dashboard-tools-${width}`, {
        capture: 'viewport'
      });
    });

    it(`shows all person roles with icons at ${width}px`, () => {
      cy.viewport(width, 900);
      cy.intercept('GET', '**/api/v1/cavers/42', {
        body: {
          id: 42,
          nickname: 'ExamplePerson',
          name: 'Marie',
          surname: 'Dupont',
          type: 'CAVER',
          groups: roles.map((name, index) => ({ id: index + 1, name })),
          documents: [],
          organizations: [],
          exploredEntrances: []
        }
      });
      visit('/persons/42');
      cy.get('[data-testid="person-properties"]').within(() => {
        roles.forEach(expectRoleIcon);
      });
      cy.screenshot(`role-chips-person-${width}`, { capture: 'viewport' });
    });
  });

  it('uses icons and text without chips in preview dropdowns', () => {
    cy.viewport(390, 900);
    visit('/dashboard');
    cy.get('[data-testid="impersonation-role-select"]').within(() => {
      cy.get('[data-testid="role-icon-Moderator"]').should('be.visible');
      cy.get('[data-testid^="role-chip-"]').should('not.exist');
    });
    cy.get('[data-testid="impersonation-role-select"]').click();
    cy.get('[role="option"]').each($option => {
      cy.wrap($option).find('[data-testid^="role-icon-"]').should('be.visible');
      cy.wrap($option).find('[data-testid^="role-chip-"]').should('not.exist');
    });
    cy.get('[role="option"][data-value="Anonymous"]').click();
    cy.get('[data-testid="impersonation-start-button"]').click();
    cy.get('[data-testid="impersonation-indicator"]').within(() => {
      cy.get('[data-testid="role-icon-Anonymous"]').should('be.visible');
      cy.get('[data-testid^="role-chip-"]').should('not.exist');
      cy.get('[data-testid="impersonation-switch-select"]').click();
    });
    cy.get('[role="option"][data-value="Leader"]').click();
    cy.get('[data-testid="impersonation-indicator"]').within(() => {
      cy.get('[data-testid="role-icon-Leader"]').should('be.visible');
      cy.get('[data-testid^="role-chip-"]').should('not.exist');
    });
    cy.screenshot('role-chips-preview-mobile', { capture: 'viewport' });
    cy.get('[data-testid="impersonation-indicator"]').within(() => {
      cy.get('[data-testid="impersonation-stop-button"]').click();
    });
    cy.get('[data-testid="impersonation-indicator"]').should('not.exist');
  });
});
