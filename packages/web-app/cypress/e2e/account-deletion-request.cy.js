describe('Account deletion request', () => {
  it('explains the manual request and opens the existing contact form', () => {
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
    ).as('getAccount');
    cy.intercept(
      { method: 'DELETE', pathname: '/api/v1/cavers/**' },
      { statusCode: 500 }
    ).as('deleteCaver');

    cy.loginAs();
    cy.visit('/ui/account', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.wait('@getAccount');
    cy.get('[data-testid="request-account-deletion"]').click();

    cy.get('[role="dialog"]')
      .should('contain.text', 'Opening this window does not send a request.')
      .and('contain.text', 'Your published contributions stay visible');
    cy.get('[data-testid="account-deletion-contact-link"]')
      .should('have.attr', 'href', 'https://en.wikicaves.org/contact')
      .and('have.attr', 'target', '_blank');
    cy.get('@deleteCaver.all').should('have.length', 0);
    cy.get('[role="dialog"]').contains('button', 'Go back').click();
    cy.get('[role="dialog"]').should('not.exist');
  });
});
