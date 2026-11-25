const uuidv7Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('API visit tracing', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept('GET', 'https://fonts.googleapis.com/**', {
      body: '',
      headers: { 'Content-Type': 'text/css' }
    });
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/**' },
      { body: [] }
    );
  });

  it('groups anonymous requests and renews after login and logout', () => {
    let token;
    let anonymousId;
    let authenticatedId;
    let phase = 'anonymous';
    cy.loginAs();
    cy.then(() => {
      token = localStorage.getItem('grottocenter_token');
      localStorage.removeItem('grottocenter_token');
    });
    cy.intercept({ pathname: '/api/v1/**', middleware: true }, request => {
      if (request.method !== 'OPTIONS') {
        const id = request.headers['x-trace-id'];
        expect(id).to.match(uuidv7Pattern);
        if (phase === 'anonymous') {
          anonymousId ??= id;
          expect(id).to.equal(anonymousId);
          request.alias = 'anonymousApi';
        }
        if (phase === 'logout' && !request.headers.authorization) {
          expect(id).not.to.equal(anonymousId);
          expect(id).not.to.equal(authenticatedId);
          request.alias = 'signedOutApi';
        }
      }
    });
    cy.intercept({ method: 'POST', pathname: '/api/v1/login' }, request => {
      expect(request.headers['x-trace-id']).to.equal(anonymousId);
      request.reply({ body: { token } });
    }).as('login');
    cy.intercept({ method: 'GET', pathname: '/api/v1/account' }, request => {
      authenticatedId = request.headers['x-trace-id'];
      expect(authenticatedId).not.to.equal(anonymousId);
      expect(request.headers.authorization).to.equal(`Bearer ${token}`);
      request.reply({
        body: { id: 1, nickname: 'TestCaver', language: 'eng' }
      });
    }).as('account');

    cy.visit('/map/45.5,6.5,10', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.wait('@anonymousApi');
    cy.contains('button', 'Log in').click();
    cy.get('#login-email').type('test@example.com');
    cy.then(() => {
      phase = 'login';
    });
    cy.get('#login-password').type('password{enter}');
    cy.wait('@login');
    cy.wait('@account');
    cy.get('button[aria-controls="menu-appbar"]').click();
    cy.then(() => {
      phase = 'logout';
    });
    cy.contains('#menu-appbar [role="menuitem"]', 'Log out').click();
    cy.wait('@signedOutApi');
    cy.window().should(win =>
      expect(win.localStorage.getItem('grottocenter_token')).to.equal(null)
    );
  });

  it('starts a new anonymous id after a reload', () => {
    let firstId;
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/entrancesCoordinates' },
      request => {
        expect(request.headers['x-trace-id']).to.match(uuidv7Pattern);
        request.reply({ body: [] });
      }
    ).as('coordinates');
    cy.visit('/map/45.5,6.5,10');
    cy.wait('@coordinates').then(({ request }) => {
      firstId = request.headers['x-trace-id'];
    });
    cy.reload();
    cy.wait('@coordinates').then(({ request }) => {
      expect(request.headers['x-trace-id']).not.to.equal(firstId);
    });
  });

  it('does not follow an API redirect to an external host', () => {
    cy.intercept('GET', 'https://external.example.org/trace-leak', {
      body: []
    }).as('external');
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/entrancesCoordinates' },
      {
        statusCode: 302,
        headers: { Location: 'https://external.example.org/trace-leak' }
      }
    ).as('redirect');
    cy.visit('/map/45.5,6.5,10', {
      onBeforeLoad: win => cy.spy(win, 'fetch').as('pageFetch')
    });
    cy.wait('@redirect');
    cy.get('@pageFetch').then(async spy => {
      const requests = spy
        .getCalls()
        .filter(call => String(call.args[0]).includes('/entrancesCoordinates'));
      expect(requests.length).to.be.greaterThan(0);
      const results = await Promise.allSettled(
        requests.map(call => call.returnValue)
      );
      results.forEach(result => expect(result.status).to.equal('rejected'));
    });
    cy.get('@external.all').should('have.length', 0);
  });
});
