const source = {
  id: 42,
  name: 'Deleted club with a very long organization name for narrow screens',
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
  [320, 390, 768, 1280].forEach(width => {
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
      cy.wait('@deletedOrganizations', { requestTimeout: 30000 });
      cy.get('[data-testid="deleted-organizations-count"]').should(
        'contain.text',
        '1 result'
      );
      cy.get('[data-testid="deleted-organization-42"]').within(() => {
        cy.contains('p', source.name).should($name => {
          const nameBounds = $name[0].getBoundingClientRect();
          const row = $name[0].parentElement;
          const button = row.querySelector(
            '[data-testid="permanent-delete-organization-42"]'
          );
          const buttonBounds = button.getBoundingClientRect();
          expect(row.scrollWidth).to.be.at.most(row.clientWidth);
          if (width < 900) {
            expect(buttonBounds.top).to.be.at.least(nameBounds.bottom);
            expect(buttonBounds.width).to.be.closeTo(row.clientWidth, 1);
          } else {
            expect(buttonBounds.left).to.be.at.least(nameBounds.right);
          }
        });
        cy.get('[data-testid="open-organization-42"]')
          .should('have.attr', 'href', '/ui/organizations/42')
          .and('have.attr', 'target', '_blank');
        cy.get('a[href$="/edit"]').should('not.exist');
      });
      cy.document().should(doc => {
        expect(doc.documentElement.scrollWidth).to.be.at.most(
          doc.documentElement.clientWidth
        );
      });
      cy.screenshot(`deleted-organizations-list-${width}`, {
        capture: 'viewport'
      });
      cy.get('[data-testid="preview-organization-42"]').click();
      cy.get('[role="dialog"]:visible').should('contain.text', source.name);
      cy.get('[role="dialog"]:visible [data-testid="organization-type"] img')
        .invoke('attr', 'src')
        .as('sourceIcon', { type: 'static' });
      cy.get('[role="dialog"]:visible button[aria-label="close"]').click();
      cy.get('[role="dialog"]:visible').should('not.exist');
      // Restored preview focus can leave its tooltip over the delete button.
      cy.get('[data-testid="preview-organization-42"]').trigger('mouseout');
      cy.get('[data-testid="permanent-delete-organization-42"]').focus();
      cy.get('[role="tooltip"]').should('not.exist');
      cy.get('[data-testid="permanent-delete-organization-42"]').click();
      cy.get('[role="dialog"]:visible').within(() => {
        cy.get('@sourceIcon').then(iconSrc => {
          cy.contains('p', source.name)
            .parent()
            .find('img')
            .should('have.attr', 'src', iconSrc);
        });
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
        '0 results'
      );
    });
  });

  it('retains the selected target after failure and locks the dialog until a retry succeeds', () => {
    cy.mockApiCatchAll();
    let isPermanentlyDeleted = false;
    let attempts = 0;
    cy.intercept({ method: 'GET', pathname: '/api/v1/organizations' }, req => {
      req.reply({
        statusCode: isPermanentlyDeleted ? 200 : 206,
        headers: isPermanentlyDeleted ? {} : { 'Content-Range': '0-1/1' },
        body: { organizations: isPermanentlyDeleted ? [] : [source] }
      });
    });
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
        attempts += 1;
        if (attempts === 1) {
          req.reply({
            statusCode: 409,
            body: { message: 'Merge target changed. Please retry.' }
          });
        } else {
          isPermanentlyDeleted = true;
          req.reply({ delay: 1500, body: source });
        }
      }
    ).as('deleteAttempt');
    visitDeleted();
    cy.get('[data-testid="permanent-delete-organization-42"]').click();
    cy.get('[role="dialog"]:visible').within(() => {
      cy.contains(target.name).should('be.visible');
      cy.contains('button', /^Merge and permanently delete$/).click();
    });
    cy.wait('@deleteAttempt');
    cy.get('[role="dialog"]:visible').within(() => {
      cy.get('[role="alert"]').should('contain.text', 'Merge target changed');
      cy.contains(target.name).should('be.visible');
      cy.contains('button', /^Merge and permanently delete$/)
        .should('be.enabled')
        .click();
      cy.get('[role="progressbar"]').should('be.visible');
      cy.contains('button', /^Cancel$/).should('be.disabled');
      cy.get('fieldset').should('be.disabled');
      cy.get('button[aria-label="close"]').should('not.exist');
    });
    cy.get('body').type('{esc}');
    cy.get('[role="dialog"]:visible').should('exist');
    cy.wait('@deleteAttempt');
    cy.get('[role="dialog"]:visible').should('not.exist');
    cy.get('[data-testid="deleted-organization-42"]').should('not.exist');
    cy.location('pathname').should('match', /\/organizations\/management$/);
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
