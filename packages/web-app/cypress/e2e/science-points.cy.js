const network = {
  id: 11,
  name: 'Test network',
  entrances: [
    { id: 101, name: 'First entrance', latitude: 45, longitude: 5 },
    { id: 102, name: 'Second entrance', latitude: 45.001, longitude: 5.001 }
  ],
  descriptions: [],
  massifs: [],
  documents: [],
  exploringOrganizations: []
};

const makeEntrance = isNetwork => ({
  ...network.entrances[0],
  cave: {
    ...network,
    entrances: isNetwork ? network.entrances : [network.entrances[0]]
  },
  descriptions: [],
  documents: [],
  comments: [],
  locations: [],
  histories: [],
  riggings: [],
  massifs: []
});

const visit = (path, { isMobile = false } = {}) =>
  cy.visit(path, {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', 'en');
      win.localStorage.removeItem('entityTable_rowsPerPage');
      if (isMobile) {
        Object.defineProperty(win.navigator, 'userAgent', {
          value:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          configurable: true
        });
      }
    }
  });

const replyPage = (req, points) => {
  const page = Number(req.query.page);
  const size = Number(req.query.size);
  req.reply({
    points: points.slice((page - 1) * size, page * size),
    total: points.length,
    page,
    size
  });
};

describe('Associated points in Science', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.loginAs({ groups: ['User', 'Administrator'] });
    cy.intercept('GET', '**/api/v1/caves/11', { body: network });
    cy.intercept('GET', '**/api/v1/entrances/101', {
      body: makeEntrance(false)
    });
  });

  [
    { path: '/entrances/101', filter: 'entranceId', id: 101 },
    { path: '/caves/11', filter: 'networkId', id: 11 }
  ].forEach(({ path, filter, id }) => {
    it(`loads ${filter} points only when Science is opened and paginates them`, () => {
      const association = filter === 'entranceId' ? 'entrance' : 'network';
      const points = Array.from({ length: 21 }, (_, index) => ({
        id: index + 1,
        label: `Station ${index + 1}`,
        underground: [true, false, null][index % 3],
        [association]: { id }
      }));
      cy.intercept({ method: 'GET', pathname: '/api/v1/points' }, req => {
        expect(req.query[filter]).to.eq(String(id));
        expect(req.query).not.to.have.property('caveId');
        replyPage(req, points);
      }).as('associatedPoints');
      visit(path);
      cy.get('h1').should('be.visible');
      cy.get('@associatedPoints.all').should('have.length', 0);
      cy.contains('[role="tab"]', 'Science').click();
      cy.wait('@associatedPoints');
      cy.get('[data-testid="science-points"]').within(() => {
        cy.contains('td', /^Station 1$/).should('be.visible');
        cy.contains('21 results').should('be.visible');
        cy.get('th').should('have.length', 2);
        cy.get('[data-testid="CheckCircleOutlinedIcon"]').should('exist');
        cy.get('[data-testid="CancelIcon"]').should('exist');
        cy.contains('td', '-').should('exist');
        cy.get('button[aria-label="Next page"]').click();
      });
      cy.wait('@associatedPoints').its('request.query.page').should('eq', '2');
      cy.get('[data-testid="science-points"]').within(() => {
        cy.contains('td', 'Station 21').should('be.visible');
        cy.contains('td', /^Station 1$/).should('not.exist');
      });
    });
  });

  it('labels the network collection explicitly on an entrance belonging to that network', () => {
    cy.intercept('GET', '**/api/v1/entrances/101', {
      body: makeEntrance(true)
    });
    cy.intercept({ method: 'GET', pathname: '/api/v1/points' }, req => {
      expect(req.query.networkId).to.eq('11');
      expect(req.query).not.to.have.property('entranceId');
      replyPage(req, [
        {
          id: 7,
          label: 'Network station',
          network: { id: 11 },
          underground: true
        }
      ]);
    }).as('networkPoints');
    visit('/entrances/101?tab=science');
    cy.wait('@networkPoints');
    cy.get('[data-testid="science-points"]').within(() => {
      cy.contains('h2', 'Network points').should('be.visible');
      cy.get('a[href="/ui/caves/11"]').should('contain', 'Test network');
      cy.contains('td', 'Network station').should('be.visible');
    });
  });

  it('falls back from an ignored modern filter to the cave without displaying unrelated points', () => {
    cy.intercept({ method: 'GET', pathname: '/api/v1/points' }, req => {
      if (req.query.caveId) {
        expect(req.query.caveId).to.eq('11');
        replyPage(req, [
          { id: 7, label: 'Legacy station', caveId: 11, underground: null }
        ]);
      } else {
        expect(req.query.entranceId).to.eq('101');
        replyPage(req, [
          {
            id: 999,
            label: 'Unrelated station',
            caveId: 99,
            underground: false
          }
        ]);
      }
    }).as('legacyPoints');
    visit('/entrances/101?tab=science');
    cy.get('[data-testid="science-points"]').within(() => {
      cy.contains('td', 'Legacy station').should('be.visible');
      cy.contains('1 result').should('be.visible');
      cy.contains('Unrelated station').should('not.exist');
    });
    cy.get('@legacyPoints.all').should('have.length', 2);
  });

  it('shows an inline error once, retries, and then displays an empty collection', () => {
    let shouldFail = true;
    cy.intercept({ method: 'GET', pathname: '/api/v1/points' }, req => {
      if (shouldFail) {
        req.reply({ statusCode: 404, body: { message: 'Not found' } });
      } else {
        replyPage(req, []);
      }
    }).as('points');
    visit('/caves/11?tab=science');
    cy.wait('@points');
    cy.get('[data-testid="science-points"]').within(() => {
      cy.contains('Unable to load the points.').should('be.visible');
      cy.contains('No results').should('not.exist');
      cy.then(() => {
        shouldFail = false;
      });
      cy.contains('button', 'Retry').click();
    });
    cy.get('@points.all').should('have.length', 2);
    cy.get('[data-testid="science-points"]').within(() => {
      cy.contains('No results').should('be.visible');
      cy.get('[data-testid="fetch-error-state"]').should('not.exist');
    });
  });

  it('loads additional network points as cards on mobile', () => {
    cy.viewport(390, 844);
    const points = Array.from({ length: 21 }, (_, index) => ({
      id: index + 1,
      label: `Mobile station ${index + 1}`,
      network: { id: 11 },
      underground: true
    }));
    cy.intercept({ method: 'GET', pathname: '/api/v1/points' }, req =>
      replyPage(req, points)
    ).as('points');
    visit('/caves/11?tab=science', { isMobile: true });
    cy.get('[data-testid="science-points"]').within(() => {
      cy.get('a[href="/ui/points/1"]').should('be.visible');
      cy.contains('button', 'Load more').click();
      cy.get('a[href="/ui/points/21"]').should('be.visible');
      cy.get('a[href="/ui/points/1"]').should('exist');
      cy.contains('button', 'Load more').should('not.exist');
    });
    cy.get('@points.all').should('have.length', 2);
  });
});
