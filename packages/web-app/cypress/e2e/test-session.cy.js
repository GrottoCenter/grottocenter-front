const visitAccount = () =>
  cy.visit('/account', {
    onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
  });

describe('Test authentication session', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/account' },
      {
        body: {
          id: 1,
          nickname: 'TestCaver',
          mail: 'caver@example.org',
          language: 'eng'
        }
      }
    ).as('account');
  });

  it('authenticates the next page when the previous window loses its storage', () => {
    cy.visit('/');
    cy.loginAs();
    cy.clearAllLocalStorage();
    visitAccount();
    cy.wait('@account');
    cy.get('[data-testid="request-account-deletion"]').should('be.visible');
  });

  it('does not reintroduce the session after subsequent navigation', () => {
    cy.loginAs();
    visitAccount();
    cy.wait('@account');
    cy.get('[data-testid="request-account-deletion"]').should('be.visible');
    cy.clearAllLocalStorage();
    visitAccount();
    cy.window().should(win => {
      expect(win.localStorage.getItem('grottocenter_token')).to.equal(null);
    });
    cy.get('[data-testid="request-account-deletion"]').should('not.exist');
    cy.get('@account.all').should('have.length', 1);
  });
});
