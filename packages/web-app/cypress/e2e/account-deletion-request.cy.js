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
    cy.visit('/account', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.location('pathname').should('eq', '/ui/account');
    cy.wait('@getAccount');
    cy.get('[data-testid="request-account-deletion"]').click();

    cy.get('[role="dialog"]')
      .should('contain.text', 'Opening this window does not send a request.')
      .and('contain.text', 'Your published contributions stay visible');
    cy.get('[data-testid="account-deletion-contact-link"]')
      .should('have.attr', 'href', 'https://en.wikicaves.org/contact')
      .and('have.attr', 'target', '_blank')
      .find('svg')
      .should('exist');
    cy.get('@deleteCaver.all').should('have.length', 0);
    let wasNavigationBlocked;
    cy.get('[data-testid="account-deletion-contact-link"]').then($link => {
      $link[0].addEventListener('click', event => {
        wasNavigationBlocked = event.defaultPrevented;
        event.preventDefault();
      });
    });
    cy.get('[data-testid="account-deletion-contact-link"]').click();
    cy.then(() => expect(wasNavigationBlocked).to.eq(false));
    cy.get('[role="dialog"]').should('not.exist');

    cy.get('[data-testid="request-account-deletion"]').click();
    cy.get('[role="dialog"]').contains('button', 'Go back').click();
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('keeps the deletion guidance available when account loading fails', () => {
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/account' },
      { statusCode: 503, body: {} }
    ).as('getAccount');

    cy.loginAs();
    cy.visit('/account', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.wait('@getAccount');
    cy.contains('An error occurred. Please try again.').should('be.visible');
    cy.get('#notistack-snackbar', { timeout: 10000 }).should('not.exist');
    cy.get('[data-testid="request-account-deletion"]')
      .should('be.visible')
      .click();
    cy.get('[role="dialog"]').should(
      'contain.text',
      'Opening this window does not send a request.'
    );
  });

  it('keeps the deletion guidance available when an offline retry pauses', () => {
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/account' },
      { statusCode: 503, body: {} }
    ).as('getAccount');

    cy.loginAs();
    cy.visit('/account', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.wait('@getAccount');
    cy.window().then(win => {
      Object.defineProperty(win.navigator, 'onLine', {
        configurable: true,
        value: false
      });
      win.dispatchEvent(new win.Event('offline'));
    });
    cy.get('[data-testid="request-account-deletion"]').should('be.visible');
    cy.contains('An error occurred. Please try again.').should('not.exist');
  });
});
