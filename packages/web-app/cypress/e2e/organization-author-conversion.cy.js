const organization = {
  id: 42,
  name: 'Jean Dupont',
  type: 'OTHER',
  isDeleted: false,
  authoredCount: 12,
  publishedCount: 0,
  cavers: [],
  exploredEntrances: [],
  exploredNetworks: [],
  partnerEntrances: [],
  partnerNetworks: [],
  managedCountries: [],
  managedRegions: [],
  managedMassifs: []
};

const person = {
  id: 8,
  nickname: 'Jean Dupont',
  type: 'CAVER',
  authoredCount: 15
};

const setup = ({
  deletedDocument = false,
  failOnce = false,
  secondConvertible = false
} = {}) => {
  const documents = Array.from({ length: 12 }, (_, index) => ({
    id: index + 101,
    title: `Survey ${index + 1}`,
    isDeleted: false,
    validationStatus: 'validated',
    authors: [{ id: 7 }, ...(index % 2 === 0 ? [{ id: 8 }] : [])],
    authorsOrganization: [{ id: 42 }, { id: 99 }],
    editor: null,
    library: null
  }));
  const second = {
    ...organization,
    id: 43,
    name: secondConvertible ? 'Jean Dupont 2' : 'A real publisher',
    authoredCount: secondConvertible ? 1 : 0,
    publishedCount: secondConvertible ? 0 : 3
  };
  if (secondConvertible) {
    documents.push({
      ...documents[0],
      id: 201,
      authorsOrganization: [{ id: 43 }, { id: 99 }]
    });
  }
  const organizations = [organization, second];
  const ownedDocumentIds = Object.fromEntries(
    organizations.map(source => [
      source.id,
      documents
        .filter(document =>
          document.authorsOrganization.some(author => author.id === source.id)
        )
        .map(document => document.id)
    ])
  );
  const deletedIds = new Set();
  const scans = { deleted: 0, pending: 0 };
  let hasFailed = false;
  const operations = [];
  cy.mockApiCatchAll();
  cy.intercept({ method: 'POST', pathname: '/api/v1/advanced-search' }, req => {
    if (req.body.entity === 'organizations') {
      expect(req.body.filter).to.deep.equal({ type: ['OTHER'] });
      req.reply({
        body: {
          results: organizations.filter(source => !deletedIds.has(source.id)),
          totalResults: organizations.filter(
            source => !deletedIds.has(source.id)
          ).length
        }
      });
      return;
    }
    if (req.body.entity !== 'documents') {
      req.reply({ body: { results: [], totalResults: 0 } });
      return;
    }
    const source = organizations.find(
      candidate =>
        candidate.name === req.body.filter?.['authorsOrganization.name']
    );
    const matches = req.body.filter?.['library.name']
      ? []
      : documents.filter(document =>
          document.authorsOrganization.some(
            author => Number(author.id) === source?.id
          )
        );
    // The live search omits relation IDs; only document details expose them.
    req.reply({
      body: {
        results: matches.map(document => ({
          id: String(document.id),
          authors: [],
          authorsOrganization: [{ name: source.name, type: 'OTHER' }]
        })),
        totalResults: matches.length
      }
    });
  });
  cy.intercept({ method: 'GET', pathname: '/api/v1/organizations/*' }, req => {
    const id = Number(new URL(req.url).pathname.split('/').pop());
    req.reply({
      body: {
        ...organizations.find(source => source.id === id),
        id,
        isDeleted: deletedIds.has(id),
        authoredCount: documents.filter(document =>
          document.authorsOrganization.some(author => Number(author.id) === id)
        ).length
      }
    });
  });
  cy.intercept({ method: 'GET', pathname: '/api/v1/documents' }, req => {
    const isTrash = new URL(req.url).searchParams.get('isDeleted') === 'true';
    // The app bar also reads the moderation queue for its badge.
    if (new URL(req.url).searchParams.has('conversionCheck')) {
      if (isTrash) scans.deleted += 1;
      else scans.pending += 1;
    }
    const rows =
      deletedDocument &&
      new URL(req.url).searchParams.get('isDeleted') === 'true'
        ? [{ ...documents[0], isDeleted: true }]
        : [];
    req.reply({
      body: { documents: rows },
      headers: rows.length ? { 'Content-Range': 'documents 0-0/1' } : {}
    });
  });
  cy.intercept({ method: 'GET', pathname: '/api/v1/documents/*' }, req => {
    const id = Number(new URL(req.url).pathname.split('/').pop());
    req.reply({ body: documents.find(document => document.id === id) });
  });
  cy.intercept(
    { method: 'POST', pathname: '/api/v1/search' },
    { body: { results: [person] } }
  );
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/cavers/*' },
    { body: person }
  );
  cy.intercept(
    { method: 'PUT', pathname: '/api/v1/documents/*/new-entities' },
    req => {
      expect(Object.keys(req.body)).to.deep.equal(['document']);
      expect(Object.keys(req.body.document).sort()).to.deep.equal([
        'authors',
        'authorsOrganization',
        'dateReviewed'
      ]);
      expect(Date.parse(req.body.document.dateReviewed)).to.be.within(
        Date.now() - 60000,
        Date.now() + 1000
      );
      const id = Number(new URL(req.url).pathname.split('/').at(-2));
      if (failOnce && id === 102 && !hasFailed) {
        hasFailed = true;
        req.reply({ statusCode: 503, body: { message: 'Temporary failure' } });
        return;
      }
      operations.push(id);
      const index = documents.findIndex(document => document.id === id);
      documents[index] = {
        ...documents[index],
        authors: req.body.document.authors.map(authorId => ({ id: authorId })),
        authorsOrganization: req.body.document.authorsOrganization.map(
          authorId => ({ id: authorId })
        )
      };
      req.reply({ body: { id } });
    }
  ).as('transfer');
  cy.intercept(
    { method: 'DELETE', pathname: '/api/v1/organizations/*' },
    req => {
      expect(new URL(req.url).searchParams.has('isPermanent')).to.equal(false);
      expect(new URL(req.url).searchParams.has('entityId')).to.equal(false);
      const sourceId = Number(new URL(req.url).pathname.split('/').pop());
      const ownedIds = ownedDocumentIds[sourceId];
      documents
        .filter(document => ownedIds.includes(document.id))
        .forEach(document => {
          expect(
            document.authors.map(author => Number(author.id)).sort()
          ).to.deep.equal([7, 8]);
          expect(
            document.authorsOrganization.map(author => Number(author.id))
          ).to.deep.equal([99]);
        });
      expect(operations.filter(id => ownedIds.includes(id))).to.deep.equal(
        ownedIds
      );
      expect(new Set(operations).size).to.equal(operations.length);
      deletedIds.add(sourceId);
      req.reply({
        body: {
          ...organizations.find(source => source.id === sourceId),
          isDeleted: true
        }
      });
    }
  ).as('archive');
  cy.loginAs({ groups: ['User', 'Moderator'] });
  cy.visit('/organizations/management', {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', 'en');
      Object.keys(win.localStorage)
        .filter(key =>
          key.startsWith('organizationManagement.authorConversion:')
        )
        .forEach(key => win.localStorage.removeItem(key));
      Object.keys(win.sessionStorage)
        .filter(key =>
          key.startsWith('organizationManagement.authorConversionSnapshot:')
        )
        .forEach(key => win.sessionStorage.removeItem(key));
    }
  });
  cy.get('[data-testid="organization-row-42"]', { timeout: 30000 }).should(
    'be.visible'
  );
  return { scans };
};

const openAndSelect = (id = 42) => {
  cy.get(`[data-testid="convert-organization-${id}"]`, { timeout: 15000 })
    .should('be.enabled')
    .click();
  cy.get('[data-testid="conversion-dialog"]').within(() => {
    cy.contains('Authored documents: 15', { timeout: 15000 }).should(
      'be.visible'
    );
    cy.get('[type="radio"]').should('not.be.checked').check();
    cy.get('[data-testid="conversion-confirm"]').should('be.disabled');
    cy.get('[type="checkbox"]').check();
  });
};

describe('Temporary organization to author conversion', () => {
  [390, 1280].forEach(width => {
    it(`preserves every other author and archives after all twelve transfers at ${width}px`, () => {
      cy.viewport(width, 720);
      const { scans } = setup();
      cy.get('[data-testid="convert-organization-43"]').should('be.disabled');
      cy.get('[data-testid="organization-row-43"]').should(
        'contain.text',
        'Published documents: 3'
      );
      cy.screenshot(width < 600 ? 'mobile' : 'desktop', {
        capture: 'viewport'
      });
      openAndSelect();
      cy.screenshot(width < 600 ? 'mobile-dialog' : 'desktop-dialog', {
        capture: 'viewport'
      });
      cy.get('[data-testid="conversion-confirm"]').click();
      cy.wait('@archive', { timeout: 30000 });
      cy.get('[data-testid="organization-row-42"]').should('not.exist');
      cy.get('[data-testid="other-organizations-total"]').should(
        'contain.text',
        '(1)'
      );
      cy.then(() => expect(scans).to.deep.equal({ deleted: 1, pending: 1 }));
    });
  });

  it('blocks an organization linked to a deleted document without creating or transferring anything', () => {
    setup({ deletedDocument: true });
    cy.get('[data-testid="organization-row-42"]').within(() => {
      cy.get('[data-testid="conversion-blockers"]').should(
        'contain.text',
        'Linked deleted documents: 1'
      );
      cy.get('[data-testid="convert-organization-42"]').should('be.disabled');
    });
    cy.get('[data-testid="conversion-dialog"]').should('not.exist');
  });

  it('selects the newly created author and removes the other choices', () => {
    setup();
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/cavers' },
      { body: { id: 55, nickname: 'Jean DUPONT', type: 'AUTHOR' } }
    ).as('createAuthor');
    cy.get('[data-testid="convert-organization-42"]')
      .should('be.enabled')
      .click();
    cy.get('[data-testid="conversion-dialog"]').within(() => {
      cy.get('[data-testid="conversion-new-author"]')
        .should('have.text', 'New author')
        .should('be.enabled')
        .click();
      cy.get('input[name="surname"]').should('have.value', 'DUPONT');
      cy.get('input[name="name"]').should('have.value', 'Jean');
      cy.get('[data-testid="conversion-create-author"]').click();
    });
    cy.wait('@createAuthor');
    cy.get('[data-testid="conversion-dialog"]').within(() => {
      cy.contains('Jean DUPONT').should('be.visible');
      cy.get('[type="radio"]').should('not.exist');
      cy.get('[data-testid="conversion-person-search"]').should('not.exist');
      cy.get('[data-testid="conversion-new-author"]').should('not.exist');
      cy.get('[data-testid="conversion-confirm"]').should('be.disabled');
      cy.get('[type="checkbox"]').check();
      cy.get('[data-testid="conversion-confirm"]').should('be.enabled');
    });
    cy.screenshot('created-author-selected', { capture: 'viewport' });
  });

  [
    { id: 33, nickname: 'Unknown', authoredCount: 149, width: 390 },
    { id: 41378, nickname: 'Auteurs multiples', authoredCount: 42, width: 1280 }
  ].forEach(({ id, nickname, authoredCount, width }) => {
    it(`selects shortcut author #${id} at ${width}px without starting a transfer`, () => {
      cy.viewport(width, 720);
      setup();
      cy.intercept(
        { method: 'GET', pathname: `/api/v1/cavers/${id}` },
        { body: { id, nickname, authoredCount, type: 'AUTHOR' } }
      ).as('shortcutPerson');
      cy.get('[data-testid="convert-organization-42"]')
        .should('be.enabled')
        .click();
      cy.get(`[data-testid="conversion-author-${id}"]`)
        .should('be.visible')
        .click();
      cy.wait('@shortcutPerson');
      cy.get('[data-testid="conversion-dialog"]').within(() => {
        cy.get('[data-testid="conversion-selected-author"]')
          .should('be.visible')
          .and('contain.text', 'Selected author for the transfer')
          .and('contain.text', nickname)
          .and('contain.text', `#${id}`)
          .and('contain.text', `Authored documents: ${authoredCount}`);
        cy.get(`[data-testid="conversion-author-${id}"]`).should(
          'have.attr',
          'aria-pressed',
          'true'
        );
        cy.get('[data-testid="conversion-confirm"]').should('be.disabled');
        cy.get('[type="checkbox"]').check();
        cy.get('[data-testid="conversion-confirm"]').should('be.enabled');
      });
      cy.screenshot(`shortcut-${id}`, { capture: 'viewport' });
    });
  });

  it('resumes after a reload without transferring a completed document twice', () => {
    const { scans } = setup({ failOnce: true });
    openAndSelect();
    cy.get('[data-testid="conversion-confirm"]').click();
    cy.get('[data-testid="conversion-dialog"]')
      .contains('A server error occurred')
      .should('be.visible');
    cy.get('[data-testid="conversion-dialog"]').within(() => {
      cy.contains('HTTP 503').should('be.visible');
      cy.contains('a', 'Document #102').should(
        'have.attr',
        'href',
        '/ui/documents/102'
      );
    });
    cy.reload();
    cy.contains('button', 'Resume conversion', { timeout: 15000 }).click();
    cy.get('[data-testid="conversion-dialog"]').within(() => {
      cy.contains('1 / 12').should('be.visible');
      cy.get('[type="radio"]').should('not.exist');
      cy.get('[type="checkbox"]').check();
      cy.get('[data-testid="conversion-confirm"]').should('be.enabled').click();
    });
    cy.wait('@archive', { timeout: 30000 });
    cy.get('[data-testid="organization-row-42"]').should('not.exist');
    cy.then(() => expect(scans).to.deep.equal({ deleted: 1, pending: 1 }));
  });

  it('reuses one global check for two conversions and repeats it only on explicit refresh', () => {
    const { scans } = setup({ secondConvertible: true });
    openAndSelect();
    cy.get('[data-testid="conversion-confirm"]').click();
    cy.wait('@archive', { timeout: 30000 });
    openAndSelect(43);
    cy.get('[data-testid="conversion-confirm"]').click();
    cy.wait('@archive', { timeout: 30000 });
    cy.get('[data-testid="other-organizations-total"]').should(
      'contain.text',
      '(0)'
    );
    cy.then(() => expect(scans).to.deep.equal({ deleted: 1, pending: 1 }));
    cy.get('[data-testid="conversion-refresh-global-check"]').click();
    cy.get('[data-testid="conversion-refresh-global-check"]').should(
      'be.enabled'
    );
    cy.then(() => expect(scans).to.deep.equal({ deleted: 2, pending: 2 }));
  });
});
