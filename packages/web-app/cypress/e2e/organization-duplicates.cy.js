const organizations = [
  {
    id: 1,
    name: 'Alpha group',
    mail: 'alpha@example.org',
    city: ' - ',
    country: '—',
    nbCavers: 0
  },
  {
    id: 2,
    name: 'Alpha duplicate',
    mail: 'alpha@example.org',
    city: 'Apt',
    nbCavers: 3
  },
  {
    id: 3,
    name: 'Beta group with a very long organization name for narrow screens',
    mail: 'beta@example.org'
  },
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
  it('remembers ignored groups in this browser and persists their reset', () => {
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/advanced-search' },
      { body: { results: organizations, totalResults: organizations.length } }
    );
    cy.loginAs({ groups: ['User', 'Moderator'] });
    cy.visit('/organizations/management?tab=duplicates', {
      onBeforeLoad: win => {
        win.localStorage.setItem('selectedLanguage', 'en');
        win.localStorage.removeItem('organizationManagement.ignoredDuplicates');
      }
    });
    cy.contains('button', 'Analyze', { timeout: 15000 }).click();
    cy.get('[data-testid="duplicate-group-1:2"]')
      .contains('button', 'Ignore')
      .click();
    cy.get('[data-testid="duplicate-group-3:4:5"]')
      .contains('button', 'Ignore')
      .click();
    cy.get('[data-testid^="duplicate-group-"]').should('have.length', 1);

    cy.window().then(win => win.sessionStorage.clear());
    cy.reload();
    cy.contains('button', 'Analyze', { timeout: 15000 }).click();
    cy.contains('7 scanned · 1 suggestion').should('be.visible');
    cy.get('[data-testid="duplicate-group-1:2"]').should('not.exist');
    cy.get('[data-testid="duplicate-group-3:4:5"]').should('not.exist');
    cy.get('[data-testid="duplicate-group-6:7"]').should('be.visible');
    cy.contains('button', 'Show ignored').click();
    expectGroupOrder();

    cy.reload();
    cy.contains('button', 'Analyze', { timeout: 15000 }).click();
    expectGroupOrder();
    cy.contains('button', 'Show ignored').should('be.disabled');
  });

  [320, 390, 768, 1280].forEach(width => {
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
          win.localStorage.removeItem(
            'organizationManagement.ignoredDuplicates'
          );
        }
      });
      cy.contains('button', 'Analyze', { timeout: 15000 }).click();
      expectGroupOrder();
      cy.get('[data-testid="duplicate-summary-1"]')
        .should('contain.text', 'Members: 0')
        .and('not.contain.text', '—')
        .and('not.contain.text', ' - ');
      cy.get('[data-testid="duplicate-summary-2"]').within(() => {
        cy.contains('p', 'Apt · alpha@example.org').should('be.visible');
        cy.contains('p', 'Members: 3').should('be.visible');
      });
      cy.get('[data-testid="duplicate-summary-1"]').should($first => {
        const first = $first[0];
        const second = first.nextElementSibling;
        const firstBounds = first.getBoundingClientRect();
        const secondBounds = second.getBoundingClientRect();
        const members = first.querySelectorAll('p')[1];
        expect(secondBounds.top).to.be.at.least(firstBounds.bottom);
        expect(members.getBoundingClientRect().right).to.be.closeTo(
          firstBounds.right,
          1
        );
      });
      cy.document().should(doc => {
        expect(doc.documentElement.scrollWidth).to.be.at.most(
          doc.documentElement.clientWidth
        );
      });
      if (width < 600) {
        cy.get('#page-tab-1').should('have.text', 'Duplicates');
        cy.get('[data-testid="page-tab-label-1"]').should($label => {
          expect(parseFloat(getComputedStyle($label[0]).fontSize)).to.equal(9);
        });
      }
      cy.screenshot(`organization-duplicates-list-${width}`, {
        capture: 'viewport'
      });
      cy.get('[data-testid="duplicate-group-3:4:5"]').within(() => {
        cy.get('a').should('not.exist');
        cy.get('[data-testid^="preview-organization-"]').should('not.exist');
        cy.contains('button', 'Compare').click();
        cy.get('[role="group"]').should($group => {
          const bounds = $group[0].getBoundingClientRect();
          [...$group[0].children].forEach(card => {
            const rect = card.getBoundingClientRect();
            expect(rect.width).to.be.at.least(Math.min(288, bounds.width) - 1);
            expect(rect.right).to.be.at.most(bounds.right + 1);
          });
        });
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
          cy.get('[data-testid="preview-organization-3"]').should('be.visible');
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
          cy.get('[data-testid^="preview-organization-"]').should('not.exist');
          cy.get('a[href$="/edit"]').should('not.exist');
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
