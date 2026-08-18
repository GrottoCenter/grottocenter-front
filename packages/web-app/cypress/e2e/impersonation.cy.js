describe('Administrator role preview', () => {
  beforeEach(() => {
    cy.mockApiCatchAll();
    cy.loginAs({ groups: ['Administrator', 'User'] });
    cy.visit('/ui/dashboard');
  });

  it('persists an anonymous preview across navigation and stops from the banner', () => {
    cy.get('[data-testid="impersonation-role-select"]').click();
    cy.get('[role="option"]').contains('Not logged in').click();
    cy.get('[data-testid="impersonation-start-button"]').click();

    cy.get('[data-testid="impersonation-indicator"]').should('be.visible');
    cy.contains('Log in').should('be.visible');

    cy.visit('/');
    cy.get('[data-testid="impersonation-indicator"]').should('be.visible');
    cy.reload();
    cy.get('[data-testid="impersonation-indicator"]').should('be.visible');

    cy.get('[data-testid="impersonation-stop-button"]').click();
    cy.get('[data-testid="impersonation-indicator"]').should('not.exist');
  });

  it('switches role directly from the banner', () => {
    cy.get('[data-testid="impersonation-start-button"]').click();
    cy.get('[data-testid="impersonation-switch-select"]').click();
    cy.get('[role="option"]').contains('Leader').click();

    cy.get('[data-testid="impersonation-switch-select"]').should(
      'contain.text',
      'Leader'
    );
  });
});
