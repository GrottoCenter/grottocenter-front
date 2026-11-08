const scopes = [
  {
    type: 'country',
    path: '/countries/FR',
    data: { id: 'FR' },
    id: 'FR'
  },
  {
    type: 'region',
    path: '/countries/US/regions/TN',
    data: { id: 'TN', name: 'Tennessee' },
    id: 'US-TN'
  },
  {
    type: 'massif',
    path: '/massifs/7',
    data: { id: 7, name: 'Test massif', descriptions: [] },
    id: '7'
  },
  {
    type: 'organization',
    path: '/organizations/42',
    data: {
      id: 42,
      name: 'Test organization',
      type: 'SPELEOLOGY',
      cavers: [{ id: 1, nickname: 'Test caver' }]
    },
    id: '42'
  }
];

const changes = Array.from({ length: 52 }, (_, i) => ({
  date: new Date(Date.now() - i * 60000).toISOString(),
  authorId: 1,
  author: 'Test caver',
  mainEntityType: 'entrance',
  mainEntityId: i + 1,
  mainAction: 'update',
  subEntityTypes: [],
  name: `Updated entrance ${i + 1}`
}));

describe('Recent-changes tabs', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
  });

  scopes.forEach(scope => {
    [
      [1280, 900],
      [390, 844]
    ].forEach(([width, height]) => {
      it(`loads and paginates ${scope.type} activity on demand at ${width}px`, () => {
        cy.viewport(width, height);
        cy.intercept('GET', `**/api/v1${scope.path}`, { body: scope.data });
        cy.intercept(
          { method: 'GET', pathname: '/api/v1/changes/recent' },
          request => {
            expect(request.query[`${scope.type}Id`]).to.equal(scope.id);
            const offset = Number(request.query.offset);
            const limit = Number(request.query.limit);
            request.reply({
              body: { changes: changes.slice(offset, offset + limit) }
            });
          }
        ).as('changes');
        cy.visit(scope.path, {
          onBeforeLoad: win =>
            win.localStorage.setItem('selectedLanguage', 'en')
        });
        cy.get('[data-testid="page-tab-activities"]').should('be.visible');
        cy.get('@changes.all').should('have.length', 0);
        cy.get('#activities').should('not.exist');
        cy.get('[data-testid="page-tab-activities"]').click();
        cy.wait('@changes').its('request.query.limit').should('eq', '51');
        cy.location('pathname').should('eq', `/ui${scope.path}`);
        cy.location('search').should('eq', '?tab=activities');
        cy.get('[data-testid="recent-change"]').should('have.length', 50);
        cy.get('[data-testid="see-all-recent-changes"]').should('not.exist');
        cy.get('[data-testid="load-more-recent-changes"]').scrollIntoView();
        cy.get('[data-testid="load-more-recent-changes"]').click();
        cy.wait('@changes').its('request.query.offset').should('eq', '50');
        cy.get('[data-testid="recent-change"]').should('have.length', 52);
        cy.get('[data-testid="page-tab-information"]').click();
        cy.get('#activities').should('not.be.visible');
        cy.get('[data-testid="page-tab-activities"]').click();
        cy.get('[data-testid="recent-change"]').should('have.length', 52);
        cy.get('@changes.all').should('have.length', 2);
        cy.reload();
        cy.wait('@changes').its('request.query.offset').should('eq', '0');
        cy.location('search').should('eq', '?tab=activities');
        cy.get('[data-testid="recent-change"]').should('have.length', 50);
        cy.get('h1').should('contain.text', scope.data.name ?? 'France');
        cy.screenshot(`recent-changes-tab-${scope.type}-${width}`);
      });
    });
  });

  it('keeps the global activity page and its pagination', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/changes/recent' },
      request => {
        expect(request.query).not.to.have.any.keys(
          'countryId',
          'regionId',
          'massifId',
          'organizationId'
        );
        const offset = Number(request.query.offset);
        const limit = Number(request.query.limit);
        request.reply({
          body: { changes: changes.slice(offset, offset + limit) }
        });
      }
    ).as('globalChanges');
    cy.visit('/changes/recent', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.wait('@globalChanges');
    cy.get('h1').should('have.text', 'Activities');
    cy.get('[data-testid="recent-change"]').should('have.length', 50);
    cy.get('[data-testid="load-more-recent-changes"]').scrollIntoView();
    cy.get('[data-testid="load-more-recent-changes"]').click();
    cy.wait('@globalChanges').its('request.query.offset').should('eq', '50');
    cy.get('[data-testid="recent-change"]').should('have.length', 52);
  });
});
