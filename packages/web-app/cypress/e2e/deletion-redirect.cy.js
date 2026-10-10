const scenarios = [
  {
    path: 'organizations',
    source: {
      name: 'Source organization',
      cavers: [],
      exploredEntrances: [{ id: 101, name: 'Linked entrance' }],
      exploredNetworks: [{ id: 102, name: 'Linked network', nbEntrances: 2 }]
    },
    target: { name: 'Destination organization', cavers: [] }
  },
  {
    path: 'documents',
    source: {
      title: 'Source document',
      type: 'Article',
      isValidated: true,
      authors: [],
      authorsOrganization: []
    },
    target: {
      title: 'Destination document',
      type: 'Article',
      isValidated: true,
      authors: [],
      authorsOrganization: []
    }
  },
  {
    path: 'massifs',
    source: { name: 'Source massif' },
    target: { name: 'Destination massif' }
  }
];

describe('Deletion with an existing redirect', () => {
  scenarios.forEach(({ path, source, target }) => {
    it(`reuses the soft-delete destination for permanent deletion of ${path}`, () => {
      cy.viewport(1280, 900);
      cy.mockApiCatchAll();
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/account' },
        { body: { id: 1, nickname: 'TestCaver', language: 'eng' } }
      );
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/languages' },
        { body: { languages: [] } }
      );
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/licenses' },
        { body: { licenses: [] } }
      );
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/documents/42/children' },
        { body: { documents: [] } }
      );
      let current = { id: 42, isDeleted: false, ...source };
      const destination = { id: 43, isDeleted: false, ...target };
      cy.intercept({ method: 'GET', pathname: `/api/v1/${path}/42` }, request =>
        request.reply({ body: current })
      ).as('source');
      cy.intercept(
        { method: 'GET', pathname: `/api/v1/${path}/43` },
        { body: destination }
      ).as('target');
      cy.intercept(
        { method: 'POST', pathname: '/api/v1/search' },
        { body: { results: [{ ...destination, _type: path }] } }
      ).as('search');
      cy.intercept(
        { method: 'DELETE', pathname: `/api/v1/${path}/42` },
        request => {
          current = { ...current, isDeleted: true, redirectTo: 43 };
          request.reply({ body: current });
        }
      ).as('delete');
      cy.loginAs({ groups: ['User', 'Moderator'] });
      cy.visit(`/${path}/42`, {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
      });
      cy.wait('@source');

      if (path === 'organizations') {
        cy.get('[data-testid="LinkOffIcon"]').should('have.length', 2);
        cy.get('[data-testid="RemoveCircleIcon"]').should('not.exist');
      }

      cy.get('button[aria-label="Delete"]').click();
      cy.get('[role="dialog"]').within(() => {
        cy.get('[role="combobox"]').type('Destination');
      });
      cy.wait('@search');
      cy.contains('[role="option"]', target.title ?? target.name).click();
      cy.get('[role="dialog"]').within(() => {
        cy.contains('button', /^Delete$/).click();
      });
      cy.wait('@delete').then(({ request }) => {
        expect(request.query.entityId).to.equal('43');
        expect(request.query).not.to.have.property('isPermanent');
      });
      cy.wait('@source');

      cy.contains('button', /^Permanently delete$/).click();
      cy.wait('@target');
      cy.get('[role="dialog"]').within(() => {
        cy.contains(target.title ?? target.name).should('be.visible');
        cy.get('[role="combobox"]').should('not.exist');
        cy.contains('button', /^Cancel$/).click();
      });
      cy.get('[role="dialog"]').should('not.exist');
      cy.contains('button', /^Permanently delete$/).click();
      cy.get('[role="dialog"]').within(() => {
        cy.contains(target.title ?? target.name).should('be.visible');
        cy.contains('button', /^Merge and permanently delete$/)
          .should('be.enabled')
          .click();
      });
      cy.wait('@delete').then(({ request }) => {
        expect(request.query).to.include({ entityId: '43', isPermanent: '1' });
      });
      cy.location('pathname').should('equal', `/ui/${path}/43`);
    });
  });
});
