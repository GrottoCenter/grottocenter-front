const resources = [
  ['organizations', 'organization', { type: 'SPELEOLOGY', cavers: [] }],
  [
    'entrances',
    'entrance',
    {
      isSensitive: true,
      cave: { id: 7, entrances: [{ id: 42 }] },
      locations: [],
      descriptions: [],
      histories: [],
      comments: [],
      riggings: []
    }
  ],
  ['massifs', 'massif', { isSensitive: true }],
  ['caves', 'network', { entrances: [], nbEntrances: 0, descriptions: [] }],
  [
    'guidelines',
    'guideline',
    {
      title: 'Deleted guideline',
      description: 'Deleted regulatory text',
      countries: [],
      regions: [],
      massifs: [],
      language: 'eng'
    }
  ],
  [
    'documents',
    'document',
    {
      title: 'Deleted refused document',
      type: 'Article',
      isValidated: false,
      dateValidation: '2026-01-01T00:00:00.000Z',
      authors: [],
      authorsOrganization: [],
      languages: [],
      files: []
    }
  ]
];

const mockReferences = () => {
  cy.disableServiceWorker();
  cy.mockApiCatchAll();
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/languages' },
    { body: { languages: [] } }
  );
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/licenses' },
    { body: { licenses: [] } }
  );
  cy.intercept('GET', '**/api/v1/documents/42/children', {
    body: { documents: [] }
  });
};

const visit = (path, groups) => {
  cy.loginAs({ groups });
  cy.visit(path, {
    onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
  });
};

describe('Deleted entities management', () => {
  [
    ['mobile', 390, 844],
    ['desktop', 1280, 800]
  ].forEach(([layout, width, height]) => {
    it(`keeps entity cards and actions compact on ${layout}`, () => {
      mockReferences();
      cy.viewport(width, height);
      const source = {
        id: 42,
        name: 'Deleted club',
        type: 'SPELEOLOGY',
        isDeleted: true,
        redirectTo: 43,
        description: 'Details available in the preview'
      };
      cy.intercept(
        {
          method: 'GET',
          pathname: '/api/v1/organizations',
          query: { isDeleted: 'true' }
        },
        {
          statusCode: 206,
          headers: { 'Content-Range': '0-1/1' },
          body: { organizations: [source] }
        }
      );
      cy.intercept('GET', '**/api/v1/organizations/42', { body: source });
      cy.intercept('GET', '**/api/v1/organizations/43', {
        body: { id: 43, name: 'Merge destination club' }
      });
      visit('/deleted-entities?type=organizations', ['Administrator']);
      cy.get('[data-testid="deleted-organization-42"]').should(
        'contain',
        'Merge destination club'
      );
      cy.get('[data-testid="deleted-organization-42"]').should($card => {
        const card = $card[0].getBoundingClientRect();
        const preview = $card[0]
          .querySelector('[aria-label="Preview"]')
          .getBoundingClientRect();
        const restore = [...$card[0].querySelectorAll('button')]
          .find(button => button.textContent.includes('Restore'))
          .getBoundingClientRect();
        const remove = $card[0]
          .querySelector('[aria-label="Permanently delete"]')
          .getBoundingClientRect();
        expect(card.right).to.be.at.most(width);
        expect(card.left).to.be.at.least(0);
        expect(card.height).to.be.lessThan(layout === 'mobile' ? 160 : 100);
        expect(
          Math.abs(
            restore.top + restore.height / 2 - remove.top - remove.height / 2
          )
        ).to.be.lessThan(2);
        if (layout === 'mobile') {
          expect(preview.bottom).to.be.at.most(restore.top);
        } else {
          expect(
            Math.abs(
              preview.top +
                preview.height / 2 -
                restore.top -
                restore.height / 2
            )
          ).to.be.lessThan(2);
        }
      });
      cy.get('[data-testid="deleted-organization-42"]')
        .find('[aria-label="Preview"]')
        .click();
      cy.get('[role="dialog"]').should(
        'contain',
        'Details available in the preview'
      );
    });
  });

  it('switches resource tabs and resets pagination', () => {
    mockReferences();
    ['organizations', 'massifs'].forEach(resource => {
      cy.intercept(
        {
          method: 'GET',
          pathname: `/api/v1/${resource}`,
          query: { isDeleted: 'true' }
        },
        {
          statusCode: 206,
          headers: { 'Content-Range': '0-1/120' },
          body: {
            [resource]: [{ id: 42, name: 'Deleted record', isDeleted: true }]
          }
        }
      ).as(resource);
    });
    visit('/deleted-entities?type=organizations&page=2', ['Administrator']);
    cy.wait('@organizations');
    cy.get('[data-testid="page-tab-massifs"]').click();
    cy.wait('@massifs').its('request.query.skip').should('equal', '0');
    cy.get('[data-testid="page-tab-massifs"]').should(
      'have.attr',
      'aria-selected',
      'true'
    );
    cy.get('[data-testid="deleted-massif-42"]').should('be.visible');
    cy.get('[data-testid="deleted-organization-42"]').should('not.exist');
    cy.location('search').should('include', 'page=1');
  });

  resources.forEach(([resource, kind, fields]) => {
    ['Administrator', 'Moderator'].forEach(role => {
      it(`lets ${role} inspect ${resource} after reloading and restore from the tool`, () => {
        mockReferences();
        let isDeleted = true;
        const source = { id: 42, name: `Deleted ${resource}`, ...fields };
        cy.intercept(
          {
            method: 'GET',
            pathname: `/api/v1/${resource}`,
            query: { isDeleted: 'true' }
          },
          req => {
            expect(req.headers.authorization).to.match(/^Bearer /);
            expect(req.query).to.include({
              isDeleted: 'true',
              skip: '0',
              limit: '50'
            });
            expect(req.query).not.to.have.property('isValidated');
            req.reply({
              statusCode: isDeleted ? 206 : 200,
              headers: isDeleted ? { 'Content-Range': '0-1/1' } : {},
              body: { [resource]: isDeleted ? [{ ...source, isDeleted }] : [] }
            });
          }
        ).as('list');
        cy.intercept(
          { method: 'GET', pathname: `/api/v1/${resource}/42` },
          req => {
            expect(req.headers.authorization).to.match(/^Bearer /);
            req.reply({ body: { ...source, isDeleted } });
          }
        ).as('detail');
        cy.intercept('POST', `**/api/v1/${resource}/42/restore`, req => {
          expect(req.headers.authorization).to.match(/^Bearer /);
          isDeleted = false;
          req.reply({ body: { ...source, isDeleted } });
        }).as('restore');

        visit(`/deleted-entities?type=${resource}`, [role]);
        cy.wait('@list');
        if (role === 'Moderator')
          cy.contains('button', /^Permanently delete$/).should('not.exist');
        cy.get(`[data-testid="open-${kind}-42"]`).click();
        cy.wait('@detail');
        cy.get('h1').should('contain.text', fields.title ?? source.name);
        cy.contains('button', /^Restore$/).should('be.visible');
        cy.reload();
        cy.wait('@detail');
        cy.get('h1').should('contain.text', fields.title ?? source.name);
        cy.contains('button', /^Restore$/).should('be.visible');
        if (role === 'Moderator')
          cy.contains('button', /^Permanently delete$/).should('not.exist');

        cy.visit(`/deleted-entities?type=${resource}`);
        cy.wait('@list');
        cy.get(`[data-testid="deleted-${kind}-42"]`)
          .contains('button', /^Restore$/)
          .click();
        cy.get('[role="dialog"]:visible')
          .contains('button', /^Restore$/)
          .should('be.enabled')
          .click();
        cy.wait('@restore');
        cy.contains('No deleted entities of this type.').should('be.visible');
        cy.get('[data-testid="deleted-entities-count"]').should(
          'contain.text',
          '0 results'
        );
        cy.location('pathname').should('equal', '/ui/deleted-entities');
      });
    });
  });

  [320, 390, 768, 1280].forEach(width => {
    it(`confirms a merged organization's permanent deletion at ${width}px`, () => {
      cy.viewport(width, 900);
      mockReferences();
      let hasRow = true;
      const source = {
        id: 42,
        name: 'Deleted organization with a long name to check narrow screens',
        type: 'RESEARCH',
        isDeleted: true,
        redirectTo: 43
      };
      cy.intercept({ method: 'GET', pathname: '/api/v1/organizations' }, req =>
        req.reply({
          statusCode: hasRow ? 206 : 200,
          headers: hasRow ? { 'Content-Range': '0-1/1' } : {},
          body: { organizations: hasRow ? [source] : [] }
        })
      ).as('list');
      cy.intercept('GET', '**/api/v1/organizations/42', { body: source });
      cy.intercept('GET', '**/api/v1/organizations/43', {
        body: { id: 43, name: 'Destination', isDeleted: false }
      });
      cy.intercept('DELETE', '**/api/v1/organizations/42*', req => {
        expect(req.query).to.include({ isPermanent: '1', entityId: '43' });
        hasRow = false;
        req.reply({ body: source });
      }).as('delete');
      visit('/organizations/management?tab=deleted', ['Administrator']);
      cy.location('pathname').should('equal', '/ui/deleted-entities');
      cy.wait('@list');
      cy.get('[data-testid="deleted-organization-42"]').should($row => {
        expect($row[0].scrollWidth).to.be.at.most($row[0].clientWidth);
      });
      cy.document().should(doc => {
        expect(doc.documentElement.scrollWidth).to.be.at.most(
          doc.documentElement.clientWidth
        );
      });
      cy.contains('button', /^Permanently delete$/).click();
      cy.get('[role="dialog"]:visible').within(() => {
        cy.contains('Destination').should('be.visible');
        cy.contains('#42').should('be.visible');
        cy.contains('button', /^Cancel$/).click();
      });
      cy.get('@delete.all').should('have.length', 0);
      cy.contains('button', /^Permanently delete$/).click();
      cy.get('[role="dialog"]:visible')
        .contains('button', /^Merge and permanently delete$/)
        .should('be.enabled')
        .click();
      cy.wait('@delete');
      cy.contains('No deleted entities of this type.').should('be.visible');
      cy.location('pathname').should('equal', '/ui/deleted-entities');
    });
  });

  it('recovers pagination after restoring the last row on a page', () => {
    mockReferences();
    let restored = false;
    const source = { id: 42, title: 'Last deleted guideline', isDeleted: true };
    cy.intercept({ method: 'GET', pathname: '/api/v1/guidelines' }, req => {
      const skip = Number(req.query.skip);
      const rows = skip === 50 && restored ? [] : [source];
      req.reply({
        statusCode: rows.length ? 206 : 200,
        headers: rows.length
          ? { 'Content-Range': `${skip}-${skip + 1}/${restored ? 50 : 51}` }
          : {},
        body: { guidelines: rows }
      });
    }).as('list');
    cy.intercept('GET', '**/api/v1/guidelines/42', { body: source });
    cy.intercept('POST', '**/api/v1/guidelines/42/restore', req => {
      restored = true;
      req.reply({ body: { ...source, isDeleted: false } });
    });
    visit('/deleted-entities?type=guidelines&page=2', ['Moderator']);
    cy.wait('@list');
    cy.contains('button', /^Restore$/).click();
    cy.get('[role="dialog"]:visible')
      .contains('button', /^Restore$/)
      .should('be.enabled')
      .click();
    cy.location('search').should('contain', 'page=1');
    cy.get('[data-testid="deleted-entities-count"]').should(
      'contain.text',
      '50 results'
    );
  });
});
