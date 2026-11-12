const territories = [
  ['country', '/countries/FR', 'FR'],
  ['region', '/countries/FR/regions/38', 'FR-38'],
  ['massif', '/massifs/7', 7]
];
const makeTerritory = id => ({
  id,
  name: 'Statistics territory',
  nativeName: 'Statistics territory',
  descriptions: [],
  guidelines: [],
  organizations: []
});

describe('geographic entrance counts', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
  });

  const visitTerritory = (path, id, statistics) => {
    cy.intercept(
      { method: 'GET', pathname: `/api/v1${path}` },
      { body: makeTerritory(id) }
    );
    cy.intercept(
      { method: 'GET', pathname: `/api/v1${path}/statistics` },
      { body: statistics }
    ).as('statistics');
    cy.visit(path, {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.wait('@statistics', { requestTimeout: 30000 });
  };

  territories.forEach(([type, path, id]) => {
    it(`waits for ${type} statistics before enabling PDF download`, () => {
      let releaseStatistics;
      const statisticsReady = new Cypress.Promise(resolve => {
        releaseStatistics = resolve;
      });
      if (type === 'massif') cy.viewport(390, 844);
      cy.intercept(
        { method: 'GET', pathname: `/api/v1${path}` },
        { body: makeTerritory(id) }
      );
      cy.intercept(
        { method: 'GET', pathname: `/api/v1${path}/statistics` },
        request =>
          statisticsReady.then(() => {
            request.reply({ body: { nb_entrances: 3, nb_networks: 1 } });
          })
      ).as('statistics');
      cy.visit(path, {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
      });
      if (type === 'massif') cy.get('button[aria-label="actions"]').click();
      cy.get('[data-testid="action-pdf"]', { timeout: 20000 }).click();
      cy.get('[data-testid="pdf-download"]', { timeout: 20000 }).should(
        'be.disabled'
      );
      cy.get('[role="dialog"] [role="status"]').should('contain', 'Loading');
      cy.screenshot(`${type}-pdf-loading`);
      cy.then(() => releaseStatistics());
      cy.wait('@statistics');
      cy.get('[data-testid="pdf-download"]').should('be.enabled');
      cy.contains('[role="dialog"] label', 'More information')
        .find('input')
        .should('be.checked');
    });

    it(`shows three entrances and one network on the ${type} page`, () => {
      visitTerritory(path, id, {
        nb_entrances: 3,
        nb_caves: 1,
        nb_networks: 1,
        avg: { avg_depth: 25, avg_length: 100 },
        total_length: { value: 100, nb_data: 1 }
      });
      cy.contains('button', 'Entrances list').should('contain', '(3)');
      cy.get('[data-testid="statistics-counts"]').within(() => {
        cy.contains('p', /^entrances$/)
          .parent()
          .should('contain', '3');
        cy.contains('p', /^network \(/)
          .parent()
          .should('contain', '1');
        cy.root().should('not.contain', 'cave (1 or multiple entrances)');
      });
      cy.get('#statistics').within(() => {
        cy.contains('25 m').should('be.visible');
        cy.contains('100 m').should('be.visible');
        cy.contains('300 m').should('not.exist');
      });
    });

    it(`shows valid zero counts on the ${type} page`, () => {
      visitTerritory(path, id, { nb_entrances: 0, nb_networks: 0, avg: null });
      cy.contains('button', 'Entrances list').should('contain', '(0)');
      cy.get('[data-testid="statistics-counts"]').within(() => {
        cy.contains('p', /^entrances$/)
          .parent()
          .should('contain', '0');
      });
      cy.get('#statistics').should('not.contain', 'Caves statistics');
      cy.get('#statistics').should('not.contain', 'Specifics caves');
    });

    [null, undefined].forEach(count => {
      it(`shows unavailable data for a ${count === null ? 'null' : 'missing'} ${type} entrance count`, () => {
        visitTerritory(path, id, { nb_entrances: count, nb_caves: 99 });
        cy.contains('button', 'Entrances list')
          .should('not.contain', '(0)')
          .and('not.contain', '(99)');
        cy.get('[data-testid="statistics-counts"]').should('not.exist');
        cy.get('#statistics').within(() => {
          cy.contains('h2', 'More information').click();
          cy.contains(
            `There is currently not enough information about this ${type}.`
          ).should('be.visible');
        });
      });
    });
  });
});
