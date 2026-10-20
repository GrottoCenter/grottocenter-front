const organizations = [
  { id: 1, name: 'Alpha group', mail: 'alpha@example.org' },
  { id: 2, name: 'Alpha duplicate', mail: 'alpha@example.org' },
  { id: 3, name: 'Beta group', mail: 'beta@example.org' },
  { id: 4, name: 'Beta duplicate', mail: 'beta@example.org' },
  { id: 5, name: 'Another beta duplicate', mail: 'beta@example.org' },
  { id: 6, name: 'Gamma group', mail: 'gamma@example.org' },
  { id: 7, name: 'Gamma duplicate', mail: 'gamma@example.org' }
].map(organization => ({
  ...organization,
  type: organization.id === 4 ? 'RESEARCH' : 'SPELEOLOGY',
  authoredCount: organization.id === 3 ? 13 : 0
}));

const expectGroupOrder = () => {
  cy.get('[data-testid^="duplicate-group-"]').should($groups => {
    expect([...$groups].map(group => group.dataset.testid)).to.deep.equal([
      'duplicate-group-1:2',
      'duplicate-group-3:4:5',
      'duplicate-group-6:7'
    ]);
  });
};

describe('Organization duplicate processing', () => {
  [390, 1280].forEach(width => {
    it(`keeps a partially processed group open and in place at ${width}px`, () => {
      const deletedIds = new Set();
      cy.viewport(width, 900);
      cy.mockApiCatchAll();
      cy.intercept(
        { method: 'POST', pathname: '/api/v1/advanced-search' },
        { body: { results: organizations, totalResults: organizations.length } }
      );
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/organizations/*' },
        req => {
          const id = Number(req.url.split('/').pop());
          req.reply({
            body: {
              ...organizations.find(organization => organization.id === id),
              isDeleted: deletedIds.has(id)
            }
          });
        }
      );
      cy.intercept(
        { method: 'DELETE', pathname: '/api/v1/organizations/*' },
        req => {
          const url = new URL(req.url);
          const id = Number(url.pathname.split('/').pop());
          expect(url.searchParams.get('entityId')).to.equal('3');
          expect(url.searchParams.has('isPermanent')).to.equal(false);
          deletedIds.add(id);
          req.reply({ body: { id, isDeleted: true, redirectTo: 3 } });
        }
      ).as('deleteOrganization');
      cy.loginAs({ groups: ['User', 'Moderator'] });
      cy.visit('/organizations/management?tab=duplicates', {
        onBeforeLoad: win => {
          win.localStorage.setItem('selectedLanguage', 'en');
          win.sessionStorage.removeItem(
            'organizationManagement.ignoredDuplicates'
          );
        }
      });
      cy.contains('button', 'Analyze duplicates', { timeout: 15000 }).click();
      expectGroupOrder();
      cy.get('[data-testid="duplicate-group-3:4:5"]').within(() => {
        cy.get('a').should('not.exist');
        cy.get('[data-testid="VisibilityIcon"]').should('not.exist');
        cy.contains('button', 'Compare').click();
        cy.get('[data-testid="duplicate-comparison-3"]').within(() => {
          cy.get('[data-testid="comparison-field-documents"] strong').should(
            'have.text',
            '13'
          );
          cy.get('[data-testid="comparison-field-type"] strong').should(
            'have.text',
            'Caving group'
          );
          cy.get('[data-testid="comparison-field-members"]')
            .should('contain.text', '0')
            .find('strong')
            .should('not.exist');
          cy.get('a[href="/ui/organizations/3"]').should(
            'have.attr',
            'target',
            '_blank'
          );
          cy.get('a[href="/ui/organizations/3/edit"]').should(
            'have.attr',
            'target',
            '_blank'
          );
          cy.get('[data-testid="VisibilityIcon"]').should('exist');
          cy.contains('button', 'Keep').click();
        });
        cy.get('[role="status"]')
          .should('have.length', 1)
          .and('contain.text', 'To keep');
        cy.get('[data-testid="duplicate-comparison-3"]')
          .contains('button', 'To keep')
          .should('not.exist');
        cy.screenshot(`organization-comparison-${width}`, {
          capture: 'viewport'
        });
        cy.get('[data-testid="duplicate-comparison-4"]')
          .contains('button', 'Delete and redirect')
          .click();
      });
      cy.get('[role="dialog"]')
        .contains('button', /^Delete$/)
        .click();
      cy.wait('@deleteOrganization');
      expectGroupOrder();
      cy.get('[data-testid="duplicate-group-3:4:5"]').within(() => {
        cy.get('[data-testid="duplicate-comparison-3"] [role="status"]').should(
          'contain.text',
          'To keep'
        );
        cy.get('[data-testid="duplicate-success-4"]').should('be.visible');
        cy.contains('1 organization left to examine.').should('be.visible');
        cy.get('[data-testid="duplicate-comparison-5"]').should('be.visible');
        cy.get(
          '[data-testid="duplicate-comparison-3"] [data-testid="comparison-field-type"] strong'
        ).should('not.exist');
        cy.get(
          '[data-testid="duplicate-comparison-3"] [data-testid="comparison-field-documents"] strong'
        ).should('have.text', '13');
        cy.get('[data-testid="duplicate-comparison-5"]')
          .contains('button', 'Delete and redirect')
          .click();
      });
      cy.get('[role="dialog"]')
        .contains('button', /^Delete$/)
        .click();
      cy.wait('@deleteOrganization');
      expectGroupOrder();
      cy.get('[data-testid="duplicate-group-3:4:5"]').within(() => {
        cy.get('[data-testid="duplicate-success-4"]').should('exist');
        cy.get('[data-testid="duplicate-success-5"]').should('exist');
        cy.get('[data-testid^="duplicate-comparison-"]').should('not.exist');
        cy.get('[data-testid="duplicate-success-5"]').within(() => {
          cy.get('a[href="/ui/organizations/5"]').should(
            'have.attr',
            'target',
            '_blank'
          );
          cy.get('a[href="/ui/organizations/3"]').should(
            'have.attr',
            'target',
            '_blank'
          );
          cy.get('[data-testid="VisibilityIcon"]').should('not.exist');
          cy.get('[data-testid="EditIcon"]').should('not.exist');
        });
        cy.screenshot(`organization-duplicates-completed-${width}`, {
          capture: 'viewport'
        });
        cy.get('[data-testid="duplicate-success-4"]')
          .contains('button', 'Got it')
          .click();
        cy.get('[data-testid="duplicate-success-5"]').should('exist');
      });
      expectGroupOrder();
    });
  });
});
