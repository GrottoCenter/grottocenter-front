const undergroundPoint = {
  id: 5,
  label: 'Underground station',
  caveId: 11,
  underground: true,
  latitude: 45,
  longitude: 6,
  documents: [],
  positions: [],
  positionCount: 0,
  isDeleted: false
};

const surfacePoint = {
  ...undergroundPoint,
  id: 6,
  label: 'Surface station',
  caveId: null,
  underground: false,
  latitude: 0,
  longitude: 0
};

const document = {
  id: 20,
  title: 'Point survey',
  type: 'Topographic Drawing',
  isValidated: true,
  files: []
};

const visit = (path, { isMobile = false } = {}) =>
  cy.visit(path, {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', 'en');
      if (isMobile) {
        Object.defineProperty(win.navigator, 'userAgent', {
          value:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          configurable: true
        });
      }
    }
  });

const selectDepth = label => {
  cy.get('[data-testid="point-depth"] [role="combobox"]').click();
  cy.contains('[role="option"]', label).click();
};

describe('Point management', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/caves/11' },
      {
        body: { id: 11, name: 'Test cave', entrances: [] }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/points' },
      {
        body: {
          points: [undergroundPoint, surfacePoint],
          total: 2,
          page: 1,
          size: 100
        }
      }
    ).as('points');
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/points/5' },
      {
        body: undergroundPoint
      }
    ).as('undergroundPoint');
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/points/6' },
      {
        body: surfacePoint
      }
    ).as('surfacePoint');
  });

  it('loads the entire catalogue and filters later pages locally, including unclassified points', () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      ...undergroundPoint,
      id: index + 100,
      label: `Station ${index + 1}`
    }));
    cy.intercept({ method: 'GET', pathname: '/api/v1/points' }, req => {
      const page = Number(req.query.page);
      req.reply({
        points:
          page === 1
            ? firstPage
            : [{ ...surfacePoint, id: 200, label: 'Écho', underground: null }],
        total: 101,
        page,
        size: 100
      });
    }).as('allPoints');
    visit('/points');
    cy.get('[role="status"]').should('contain', '101 results');
    cy.get('[data-testid="entity-type-filter"]')
      .should('have.attr', 'aria-label', 'Depth')
      .find('[role="button"]')
      .should('have.length', 3)
      .then(options => {
        expect([...options].map(option => option.textContent)).to.deep.equal([
          'All',
          'Surface',
          'Underground'
        ]);
      });
    cy.get('[data-testid="points-search"] input').type('echo');
    cy.get('[role="status"]').should('contain', '1 result');
    cy.contains('td', 'Écho').should('be.visible');
    cy.get('[data-testid="entity-type-filter"]')
      .contains('[role="button"]', 'Surface')
      .click();
    cy.get('[data-testid="entity-type-filter"]')
      .contains('[role="button"]', 'Surface')
      .should('have.attr', 'aria-pressed', 'true');
    cy.contains('td', 'Écho').should('not.exist');
    cy.get('[data-testid="entity-type-filter"]')
      .contains('[role="button"]', 'All')
      .click();
    cy.contains('td', 'Écho').should('exist');
    cy.get('@allPoints.all').should('have.length', 2);
  });

  it('filters the complete catalogue on mobile', () => {
    cy.viewport('iphone-x');
    visit('/points', { isMobile: true });
    cy.get('a[href="/ui/points/6"]').should('be.visible');
    cy.contains('Underground station').should('be.visible');
    cy.contains('Surface station').should('be.visible');
    cy.get('[data-testid="points-search"] input').type('Surface');
    cy.contains('Underground station').should('not.exist');
    cy.contains('Surface station').should('be.visible');
  });

  it('requires a cave for an underground point and never requests coordinates', () => {
    cy.loginAs();
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/search' },
      {
        body: { results: [{ id: '11', name: 'Test cave', _type: 'caves' }] }
      }
    ).as('caves');
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/points' },
      {
        body: undergroundPoint
      }
    ).as('create');
    visit('/entity/add/point');
    cy.get('[data-testid="point-form"]', { timeout: 15000 }).should(
      'be.visible'
    );
    cy.get('[data-testid="point-label"] input').type('Underground station');
    selectDepth('Underground');
    cy.get('[name="latitude"]').should('not.exist');
    cy.get('[name="longitude"]').should('not.exist');
    cy.get('[data-testid="point-submit"]').click();
    cy.get('@create.all').should('have.length', 0);
    cy.contains('Required').should('be.visible');
    cy.get('[data-testid="point-form"] input[role="combobox"]').type(
      'Test cave'
    );
    cy.wait('@caves');
    cy.contains('[role="option"]', 'Test cave').click();
    cy.get('[data-testid="point-submit"]').click();
    cy.wait('@create').its('request.body').should('deep.equal', {
      label: 'Underground station',
      underground: true,
      caveId: 11
    });
    cy.location('pathname').should('eq', '/ui/points/5');
    cy.get('[data-testid="point-map"]').should('not.exist');
    cy.contains('Test cave').should('exist');
  });

  it('requires a surface position, accepts zero and draws the violet pin', () => {
    cy.loginAs();
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/points' },
      { body: surfacePoint }
    ).as('create');
    visit('/entity/add/point');
    cy.get('[data-testid="point-label"] input').type('Surface station');
    selectDepth('Surface');
    cy.get('[data-testid="point-submit"]').click();
    cy.get('@create.all').should('have.length', 0);
    cy.get('[name="latitude"]').type('91');
    cy.get('[name="longitude"]').type('181');
    cy.get('[data-testid="point-submit"]').click();
    cy.get('@create.all').should('have.length', 0);
    cy.get('[name="latitude"]').clear();
    cy.get('[name="latitude"]').type('0');
    cy.get('[name="longitude"]').clear();
    cy.get('[name="longitude"]').type('0');
    cy.get('[data-testid="point-submit"]').click();
    cy.wait('@create').its('request.body').should('deep.equal', {
      label: 'Surface station',
      underground: false,
      caveId: null,
      latitude: 0,
      longitude: 0
    });
    cy.location('pathname').should('eq', '/ui/points/6');
    cy.get('[data-testid="point-map"] .point-marker path').should(
      'have.attr',
      'fill',
      '#7b1fa2'
    );
  });

  it('preserves form values after an API failure and omits underground coordinates on edit', () => {
    cy.loginAs();
    cy.intercept(
      { method: 'PATCH', pathname: '/api/v1/points/5' },
      {
        statusCode: 400,
        body: { message: 'Test validation error' }
      }
    ).as('update');
    visit('/points/5/edit');
    cy.get('[data-testid="point-label"] input').clear();
    cy.get('[data-testid="point-label"] input').type('New label');
    cy.get('[data-testid="point-submit"]').click();
    cy.wait('@update').its('request.body').should('deep.equal', {
      label: 'New label',
      underground: true,
      caveId: 11
    });
    cy.contains('Test validation error').should('be.visible');
    cy.get('[data-testid="point-label"] input').should(
      'have.value',
      'New label'
    );
    cy.get('[name="latitude"]').should('not.exist');
  });

  it('requires explicit classification of a legacy point and saves without exposing underground coordinates', () => {
    cy.loginAs();
    let point = { ...undergroundPoint, underground: null };
    cy.intercept({ method: 'GET', pathname: '/api/v1/points/5' }, req =>
      req.reply(point)
    );
    cy.intercept({ method: 'PATCH', pathname: '/api/v1/points/5' }, req => {
      point = { ...point, ...req.body };
      req.reply(point);
    }).as('classify');
    visit('/points/5/edit');
    cy.get('[data-testid="point-form"]', { timeout: 15000 }).should(
      'be.visible'
    );
    cy.get('[data-testid="point-submit"]').click();
    cy.get('@classify.all').should('have.length', 0);
    cy.contains('Required').should('be.visible');
    selectDepth('Underground');
    cy.get('[name="latitude"]').should('not.exist');
    cy.get('[data-testid="point-submit"]').click();
    cy.wait('@classify').its('request.body').should('deep.equal', {
      label: undergroundPoint.label,
      underground: true,
      caveId: 11
    });
    cy.location('pathname').should('eq', '/ui/points/5');
    cy.contains('Test cave').should('be.visible');
    cy.get('[data-testid="point-map"]').should('not.exist');
  });

  it('associates documents and refreshes the point, then unlinks as moderator', () => {
    cy.loginAs({ groups: ['Moderator'] });
    let documents = [];
    cy.intercept({ method: 'GET', pathname: '/api/v1/points/5' }, req =>
      req.reply({ ...undergroundPoint, documents })
    );
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/advanced-search' },
      {
        body: { results: [document], totalResults: 1 }
      }
    ).as('searchDocuments');
    cy.intercept(
      { method: 'PUT', pathname: '/api/v1/points/5/documents/20' },
      req => {
        documents = [document];
        req.reply({ statusCode: 204 });
      }
    ).as('link');
    cy.intercept(
      { method: 'DELETE', pathname: '/api/v1/points/5/documents/20' },
      req => {
        documents = [];
        req.reply({ statusCode: 204 });
      }
    ).as('unlink');
    visit('/points/5?tab=documents');
    cy.get('[data-testid="associate-documents-button"]').click();
    cy.contains('button', /^Search$/).click();
    cy.wait('@searchDocuments');
    cy.contains('tr', 'Point survey').find('input[type="checkbox"]').check();
    cy.contains('button', 'Associate 1 document').click();
    cy.wait('@link');
    cy.contains('a', 'Point survey').should('be.visible');
    cy.get('[aria-label="unlink"]').click();
    cy.get('[role="dialog"]').contains('button', 'Yes').click();
    cy.wait('@unlink');
    cy.contains('There are no documents associated with this point.').should(
      'be.visible'
    );
  });

  it('restricts moderation actions and performs only soft deletion', () => {
    cy.loginAs({ groups: ['Moderator'] });
    cy.intercept({ method: 'DELETE', pathname: '/api/v1/points/5' }, req => {
      expect(req.query).not.to.have.property('isPermanent');
      req.reply({ ...undergroundPoint, isDeleted: true });
    }).as('delete');
    visit('/points/5');
    cy.get('button[aria-label="Delete"]').click();
    cy.get('[role="dialog"]')
      .contains('button', /^Delete$/)
      .click();
    cy.wait('@delete');
    cy.location('pathname').should('eq', '/ui/points');

    cy.loginAs({ groups: ['User'] });
    visit('/points/5');
    cy.get('button[aria-label="Delete"]').should('not.exist');
    cy.contains('Permanently delete').should('not.exist');
  });

  it('keeps the entity layout on a missing point and retries from the active tab', () => {
    let pointExists = false;
    cy.intercept({ method: 'GET', pathname: '/api/v1/points/999' }, req => {
      if (pointExists) {
        req.reply({ ...undergroundPoint, id: 999 });
      } else {
        req.reply({ statusCode: 404, body: { message: 'Point not found.' } });
      }
    }).as('missingPoint');
    visit('/points/999?tab=documents');
    cy.wait('@missingPoint');
    cy.contains('[role="tab"]', 'Information').should('be.visible');
    cy.contains('[role="tab"]', 'Documents').should('be.visible');
    cy.get('h1').should('have.text', '');
    cy.get('[data-testid="entity-page-state"]')
      .filter(':visible')
      .should('contain', 'Point not found.');
    cy.then(() => {
      pointExists = true;
    });
    cy.get('[data-testid="entity-page-state"]')
      .filter(':visible')
      .contains('button', 'Retry')
      .click();
    cy.wait('@missingPoint');
    cy.get('h1').should('contain', undergroundPoint.label);
    cy.get('[data-testid="entity-page-state"]').should('not.exist');
    cy.contains('There are no documents associated with this point.').should(
      'be.visible'
    );
  });

  it('shows deleted points without restore or permanent-delete actions', () => {
    cy.loginAs({ groups: ['Moderator'] });
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/points/5' },
      { body: { ...undergroundPoint, isDeleted: true } }
    );
    visit('/points/5');
    cy.contains('has been deleted').should('be.visible');
    cy.contains('button', 'Restore').should('not.exist');
    cy.contains('Permanently delete').should('not.exist');
    cy.get('a[href="/ui/points/5/edit"]').should('not.exist');
  });
});
