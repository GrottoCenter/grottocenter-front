const offlineMessage =
  'Search requires an internet connection. Caves you have already opened remain available.';

const expectOfflineSearch = () => {
  cy.get('[data-testid="offline-search-state"]').scrollIntoView();
  cy.get('[data-testid="offline-search-state"]')
    .should('be.visible')
    .and('contain.text', offlineMessage);
};

const setConnectivity = (win, isOnline) => {
  Object.defineProperty(win.navigator, 'onLine', {
    configurable: true,
    value: isOnline
  });
  win.dispatchEvent(new win.Event(isOnline ? 'online' : 'offline'));
};

const visitSearch = (entity, isOnline) => {
  cy.visit(`/${entity}`, {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', 'en');
      // No offline event: this reproduces opening the app already disconnected.
      Object.defineProperty(win.navigator, 'onLine', {
        configurable: true,
        value: isOnline
      });
    }
  });
};

describe('Offline entity searches', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.mockApiCatchAll();
    cy.intercept('GET', '**/api/v1/languages', { languages: [] });
    cy.intercept('GET', '**/api/v1/documents/types*', { documentTypes: [] });
    cy.intercept('GET', '**/api/v1/documents/subjects', { subjects: [] });
  });

  ['entrances', 'documents'].forEach(entity => {
    it(`defers the initial ${entity} search until reconnection`, () => {
      cy.intercept('POST', '**/api/v1/advanced-search', {
        results: [],
        totalResults: 0
      }).as('search');
      visitSearch(entity, false);

      expectOfflineSearch();
      cy.get('button[type="submit"]').should('be.disabled');
      cy.get('@search.all').should('have.length', 0);
      cy.get('body').should('not.contain.text', 'unexpected error');

      cy.window().then(win => setConnectivity(win, true));
      cy.wait('@search').its('request.body.entity').should('eq', entity);
      cy.get('[data-testid="offline-search-state"]').should('not.exist');
      cy.contains('No results').should('be.visible');
      cy.get('@search.all').should('have.length', 1);
    });

    it(`recovers a ${entity} search interrupted by disconnection`, () => {
      let releaseRequest;
      const requestGate = new Promise(resolve => {
        releaseRequest = resolve;
      });
      let requestCount = 0;
      cy.intercept('POST', '**/api/v1/advanced-search', req => {
        requestCount++;
        if (requestCount === 1) {
          return requestGate.then(() => req.destroy());
        }
        req.reply({ results: [], totalResults: 0 });
        return undefined;
      }).as('search');
      visitSearch(entity, true);
      cy.get('h1').should('be.visible');
      cy.wrap(null).should(() => expect(requestCount).to.eq(1));

      cy.window().then(win => {
        setConnectivity(win, false);
        releaseRequest();
      });
      expectOfflineSearch();
      cy.get('body').should('not.contain.text', 'unexpected error');

      cy.window().then(win => setConnectivity(win, true));
      cy.contains('No results').should('be.visible');
      cy.get('[data-testid="offline-search-state"]').should('not.exist');
      cy.get('@search.all').should('have.length', 2);
      cy.get('body').should('not.contain.text', 'unexpected error');
    });

    it(`retains ${entity} results and disables remote actions in both views`, () => {
      cy.intercept('POST', '**/api/v1/advanced-search', {
        results: [
          {
            id: 7,
            name: 'Saved entrance',
            title: 'Saved document',
            type: 'Article'
          }
        ],
        totalResults: 500
      }).as('search');
      visitSearch(entity, true);
      cy.wait('@search');
      const name = entity === 'documents' ? 'Saved document' : 'Saved entrance';
      cy.contains(name).should('be.visible');

      cy.window().then(win => setConnectivity(win, false));
      expectOfflineSearch();
      cy.contains(name).should('be.visible');
      cy.get('button[aria-label="Next page"]').should('be.disabled');
      cy.get('input[aria-label="Go to page"]').should('be.disabled');
      cy.contains('button', /^Export/).should('be.disabled');

      cy.get('button[aria-label="Card view"]').click();
      cy.contains(name).should('be.visible');
      cy.contains('button', 'Load more').should('be.disabled');
      cy.contains('button', 'Sort by').should('be.disabled');
      cy.get('@search.all').should('have.length', 1);
      cy.get('body').should('not.contain.text', 'unexpected error');

      cy.window().then(win => setConnectivity(win, true));
      cy.contains('button', 'Load more').should('not.be.disabled');
      cy.contains('button', 'Sort by').should('not.be.disabled');
      cy.get('[data-testid="offline-search-state"]').should('not.exist');
    });

    ['table', 'cards'].forEach(view => {
      it(`preserves ${entity} pagination in ${view} view after an interrupted page change`, () => {
        let releaseRequest;
        const requestGate = new Promise(resolve => {
          releaseRequest = resolve;
        });
        let secondPageRequests = 0;
        cy.intercept('POST', '**/api/v1/advanced-search', req => {
          const page = req.body.page ?? 1;
          if (page === 2) {
            secondPageRequests++;
            if (secondPageRequests === 1) {
              return requestGate.then(() => req.destroy());
            }
          }
          req.reply({
            results: [
              {
                id: page,
                name: `Result page ${page}`,
                title: `Result page ${page}`,
                type: 'Article'
              }
            ],
            totalResults: 500
          });
          return undefined;
        }).as('search');
        visitSearch(entity, true);
        cy.wait('@search');
        cy.contains('Result page 1').should('be.visible');
        if (view === 'cards') {
          cy.get('button[aria-label="Card view"]').click();
          cy.contains('button', 'Load more').click();
        } else {
          cy.get('button[aria-label="Next page"]').click();
        }
        cy.wrap(null).should(() => expect(secondPageRequests).to.eq(1));

        cy.window().then(win => {
          setConnectivity(win, false);
          releaseRequest();
        });
        expectOfflineSearch();
        cy.contains('Result page 1').should('not.be.visible');
        cy.get('body').should('not.contain.text', 'unexpected error');

        cy.window().then(win => setConnectivity(win, true));
        cy.contains('Result page 2').should('be.visible');
        if (view === 'cards') {
          cy.contains('Result page 1').should('be.visible');
        } else {
          cy.get('input[aria-label="Go to page"]').should('have.value', '2');
        }
        cy.get('@search.all').should('have.length', 3);
      });
    });
  });

  it('uses the same offline state for my contributions', () => {
    cy.intercept('POST', '**/api/v1/advanced-search', {
      results: [],
      totalResults: 0
    }).as('search');
    cy.loginAs();
    visitSearch('contributions', false);
    expectOfflineSearch();
    cy.get('@search.all').should('have.length', 0);
    cy.window().then(win => setConnectivity(win, true));
    cy.wait('@search').its('request.body.filter.creatorId').should('eq', 1);
    cy.contains('No results').should('be.visible');
  });
});
