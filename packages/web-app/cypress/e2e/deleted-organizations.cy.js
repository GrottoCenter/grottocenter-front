const source = {
  id: 42,
  name: 'Deleted club',
  type: 'SPELEOLOGY',
  isDeleted: true,
  redirectTo: 43,
  cavers: []
};
const target = {
  id: 43,
  name: 'Surviving club',
  type: 'SPELEOLOGY',
  isDeleted: false,
  cavers: []
};

const visitDeleted = () => {
  cy.loginAs({ groups: ['User', 'Moderator', 'Administrator'] });
  cy.visit('/organizations/management?tab=deleted', {
    onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
  });
};

describe('Deleted organizations', () => {
  [390, 1280].forEach(width => {
    it(`previews deleted organizations and confirms permanent deletion at ${width}px`, () => {
      cy.viewport(width, 900);
      cy.mockApiCatchAll();
      let isPermanentlyDeleted = false;
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/organizations' },
        req => {
          expect(req.query).to.include({
            isDeleted: 'true',
            limit: '50',
            skip: '0'
          });
          req.reply({
            statusCode: isPermanentlyDeleted ? 200 : 206,
            headers: isPermanentlyDeleted ? {} : { 'Content-Range': '0-1/1' },
            body: { organizations: isPermanentlyDeleted ? [] : [source] }
          });
        }
      ).as('deletedOrganizations');
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/organizations/42' },
        { body: source }
      );
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/organizations/43' },
        { body: target }
      );
      cy.intercept(
        { method: 'DELETE', pathname: '/api/v1/organizations/42' },
        req => {
          expect(req.query).to.include({ isPermanent: '1', entityId: '43' });
          isPermanentlyDeleted = true;
          req.reply({ body: source });
        }
      ).as('permanentDelete');
      visitDeleted();
      cy.wait('@deletedOrganizations');
      cy.get('[data-testid="deleted-organizations-count"]').should(
        'contain.text',
        'Soft-deleted organizations: 1'
      );
      cy.get('[data-testid="deleted-organization-42"]').within(() => {
        cy.get('[data-testid="open-organization-42"]')
          .should('have.attr', 'href', '/ui/organizations/42')
          .and('have.attr', 'target', '_blank');
        cy.get('a[href$="/edit"]').should('not.exist');
        cy.get('[data-testid="preview-organization-42"]').click();
      });
      cy.get('[role="dialog"]:visible').should('contain.text', source.name);
      cy.get('[role="dialog"]:visible button[aria-label="close"]').click();
      cy.get('[role="dialog"]:visible').should('not.exist');
      cy.get('[data-testid="permanent-delete-organization-42"]').click();
      cy.get('[role="dialog"]:visible').within(() => {
        cy.contains(target.name).should('be.visible');
        cy.get('a[href="/ui/organizations/43"]').should('not.exist');
        cy.screenshot(`deleted-organization-confirmation-${width}`, {
          capture: 'viewport'
        });
        cy.contains('button', /^Merge and permanently delete$/)
          .should('be.enabled')
          .click();
      });
      cy.wait('@permanentDelete');
      cy.get('[role="dialog"]:visible').should('not.exist');
      cy.get('[data-testid="deleted-organization-42"]').should('not.exist');
      cy.get('[data-testid="deleted-organizations-count"]').should(
        'contain.text',
        'Soft-deleted organizations: 0'
      );
    });
  });

  it('does not present active organizations returned by an outdated API as deleted', () => {
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/organizations' },
      { body: { organizations: [target] } }
    );
    visitDeleted();
    cy.get('[data-testid="deleted-organizations-section"]').within(() => {
      cy.get('[role="alert"]').should(
        'contain.text',
        'The list of deleted organizations is currently unavailable.'
      );
      cy.get('[data-testid="deleted-organizations-count"]').should('not.exist');
      cy.get('[data-testid^="deleted-organization-"]').should('not.exist');
      cy.get('[data-testid^="permanent-delete-organization-"]').should(
        'not.exist'
      );
    });
  });
});
