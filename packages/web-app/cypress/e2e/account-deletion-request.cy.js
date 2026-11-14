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
    cy.get('[data-testid="page-tab-activities"]').should(
      'contain.text',
      'Caving practice'
    );
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
    let anchorStillConnected;
    cy.document().then(doc => {
      doc.addEventListener(
        'click',
        event => {
          anchorStillConnected = event.target.isConnected;
          event.preventDefault();
        },
        { once: true }
      );
    });
    cy.get('[data-testid="account-deletion-contact-link"]').click();
    cy.then(() => expect(anchorStillConnected).to.eq(true));
    cy.get('[role="dialog"]').should('not.exist');

    cy.get('[data-testid="request-account-deletion"]').click();
    cy.get('[role="dialog"]').contains('button', 'Go back').click();
    cy.get('[role="dialog"]').should('not.exist');
  });

  [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 1280, height: 900 }
  ].forEach(({ width, height }) => {
    it(`fits the French deletion guidance and actions at ${width}px`, () => {
      const isMobile = width < 600;
      cy.viewport(width, height);
      cy.mockApiCatchAll();
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/account' },
        {
          body: {
            id: 1,
            nickname: 'TestCaver',
            mail: 'caver@example.org',
            language: 'fra'
          }
        }
      );
      cy.loginAs();
      cy.visit('/account', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'fr')
      });
      cy.get('[data-testid="request-account-deletion"]')
        .should('contain.text', 'Demander la suppression de mon compte')
        .find('svg')
        .should('exist');
      if (width === 390) {
        cy.get('[data-testid="request-account-deletion"]').screenshot(
          'account-deletion-request-button-french-mobile'
        );
      }
      cy.get('[data-testid="request-account-deletion"]').click();

      cy.get('[role="dialog"]:visible').should($dialog => {
        const dialog = $dialog[0];
        const bounds = dialog.getBoundingClientRect();
        const contact = dialog
          .querySelector('[data-testid="account-deletion-contact-link"]')
          .getBoundingClientRect();
        const back = dialog
          .querySelector('[data-testid="account-deletion-back"]')
          .getBoundingClientRect();
        expect(dialog.scrollWidth).to.be.at.most(dialog.clientWidth);
        expect(contact.left).to.be.at.least(0);
        expect(contact.right).to.be.at.most(width);
        expect(back.bottom).to.be.at.most(height);
        if (isMobile) {
          expect(bounds.left).to.eq(0);
          expect(bounds.top).to.eq(0);
          expect(bounds.width).to.eq(width);
          expect(bounds.height).to.eq(height);
          expect(contact.width).to.be.closeTo(width - 32, 1);
          expect(back.width).to.be.closeTo(contact.width, 1);
          expect(contact.bottom).to.be.at.most(back.top);
        } else {
          expect(bounds.width).to.be.lessThan(width);
          expect(bounds.height).to.be.lessThan(height);
          expect(back.right).to.be.at.most(contact.left);
        }
      });
      cy.contains(
        'Vos contributions publiées restent visibles'
      ).scrollIntoView();
      cy.contains('Vos contributions publiées restent visibles').should(
        'be.visible'
      );
      cy.get('[data-testid="account-deletion-contact-link"]')
        .should('be.visible')
        .and('have.attr', 'href', 'https://fr.wikicaves.org/contact');
      cy.screenshot(`account-deletion-french-${width}`, {
        capture: 'viewport'
      });
      cy.get('[data-testid="account-deletion-back"]').click();
      cy.get('[role="dialog"]:visible').should('not.exist');
    });
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
    cy.get('[data-testid="app-snackbar"]').should('be.visible');
    cy.get('[data-testid="app-snackbar"]', { timeout: 10000 }).should(
      'not.exist'
    );
    cy.get('[data-testid="request-account-deletion"]')
      .should('be.visible')
      .click();
    cy.get('[role="dialog"]').should(
      'contain.text',
      'Opening this window does not send a request.'
    );
  });

  it('keeps the deletion guidance available when an offline retry pauses', () => {
    // Hold the failed response until React Query has received the offline event.
    let releaseAccountResponse;
    const accountResponseGate = new Promise(resolve => {
      releaseAccountResponse = resolve;
    });
    cy.mockApiCatchAll();
    cy.intercept({ method: 'GET', pathname: '/api/v1/account' }, req =>
      accountResponseGate.then(() => req.reply({ statusCode: 503, body: {} }))
    ).as('getAccount');

    cy.loginAs();
    cy.visit('/account', {
      onBeforeLoad: win => {
        win.localStorage.setItem('selectedLanguage', 'en');
        Object.defineProperty(win.navigator, 'onLine', {
          configurable: true,
          value: false
        });
      }
    });
    cy.contains('h1', 'My Account').should('be.visible');
    cy.window().then(win => {
      win.dispatchEvent(new win.Event('offline'));
      releaseAccountResponse();
    });
    cy.wait('@getAccount');
    cy.get('[data-testid="request-account-deletion"]').should('be.visible');
    cy.get('@getAccount.all').should('have.length', 1);
    cy.contains('An error occurred. Please try again.').should('not.exist');
  });
});
