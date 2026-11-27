const people = [
  {
    id: 101,
    name: 'Marie',
    surname: 'Dupont',
    nickname: 'Marie Dupont',
    type: 'AUTHOR',
    authoredCount: 25,
    documents: []
  },
  {
    id: 102,
    name: 'Marie',
    surname: 'Dupont',
    nickname: 'Marie D.',
    type: 'CAVER',
    authoredCount: 3,
    documents: []
  },
  {
    id: 103,
    name: 'Jean',
    surname: 'Martin',
    nickname: 'Jean Martin',
    type: 'AUTHOR',
    authoredCount: 0,
    documents: []
  },
  {
    id: 104,
    name: 'Jean',
    surname: 'Martin',
    nickname: 'J. Martin',
    type: 'AUTHOR',
    authoredCount: 2,
    documents: []
  }
];

const visitManagement = (groups = ['User', 'Moderator']) => {
  cy.loginAs({ groups });
  cy.visit('/persons/management', {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', 'en');
      win.localStorage.removeItem('authorManagement.ignoredDuplicates.v1');
    }
  });
};

// Cypress stitches full-page images from several scroll positions. Keep the
// app chrome at the document top instead of repeating it in every segment.
const captureComparison = width => {
  cy.document().then(doc => {
    const chrome = [...doc.querySelectorAll('*')].filter(element =>
      ['fixed', 'sticky'].includes(getComputedStyle(element).position)
    );
    const positions = chrome.map(element => ({
      element,
      value: element.style.getPropertyValue('position'),
      priority: element.style.getPropertyPriority('position')
    }));
    chrome.forEach(element =>
      element.style.setProperty('position', 'absolute', 'important')
    );
    cy.screenshot(`author-comparison-${width}`, { capture: 'fullPage' });
    cy.then(() => {
      positions.forEach(({ element, value, priority }) => {
        if (value) element.style.setProperty('position', value, priority);
        else element.style.removeProperty('position');
      });
    });
  });
};

describe('Author duplicate management', () => {
  beforeEach(() => {
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/advanced-search' },
      { body: { results: people, totalResults: people.length } }
    ).as('scan');
    cy.intercept({ method: 'GET', pathname: '/api/v1/cavers/*' }, req => {
      const id = Number(new URL(req.url).pathname.split('/').pop());
      req.reply({ body: people.find(person => person.id === id) });
    });
    cy.intercept({ method: 'DELETE', pathname: '/api/v1/cavers/*' }, req => {
      const url = new URL(req.url);
      const id = Number(url.pathname.split('/').pop());
      expect(people.find(person => person.id === id).type).to.equal('AUTHOR');
      expect(url.searchParams.get('entityId')).not.to.equal(String(id));
      req.reply({ body: people.find(person => person.id === id) });
    }).as('merge');
  });

  it('opens management from the dashboard without starting a scan', () => {
    cy.loginAs({ groups: ['User', 'Moderator'] });
    cy.visit('/dashboard', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.get('a[href="/ui/persons/management"]', { timeout: 20000 })
      .should('contain.text', 'Authors')
      .click();
    cy.get('h1', { timeout: 20000 }).should('have.text', 'Manage authors');
    cy.get('[role="tablist"]').should('not.exist');
    cy.get('@scan.all').should('have.length', 0);
  });

  [320, 390, 1280].forEach(width => {
    it(`compares and merges an author into a caver at ${width}px`, () => {
      cy.viewport(width, 900);
      visitManagement();
      cy.contains('button', 'Analyze', { timeout: 20000 }).click();
      cy.wait('@scan')
        .its('request.body')
        .should('include', { entity: 'persons', size: 1000 });
      cy.get('[data-testid="author-pair-101:102"]').within(() => {
        cy.contains('button', 'Compare').click();
        cy.get('[role="combobox"]').should('not.exist');
        cy.get('[data-testid="author-comparison-101"] h3').within(() => {
          cy.get('strong')
            .should('have.text', 'Marie Dupont')
            .and('have.css', 'font-weight', '600');
          cy.get('img').should('have.attr', 'alt', 'Author');
          cy.contains('span', /^#101$/).should(
            'have.css',
            'font-weight',
            '400'
          );
        });
        cy.get('[data-testid="comparison-field-type"]').should('not.exist');
        // MUI's icon test IDs are omitted from production builds. Assert the
        // actions' accessible labels and SVGs in both development and CI.
        cy.get('[data-testid="preview-person-101"]')
          .should('be.visible')
          .and('have.attr', 'aria-label', 'Preview — Marie Dupont (#101)')
          .find('svg')
          .should('be.visible');
        cy.get('[data-testid="open-person-101"]')
          .should('have.attr', 'target', '_blank')
          .and('have.attr', 'href', '/ui/persons/101')
          .and(
            'have.attr',
            'aria-label',
            'Open profile — Marie Dupont (#101) (Opens in a new tab)'
          )
          .find('svg')
          .should('be.visible');
        cy.get(
          '[data-testid="author-comparison-101"] [data-testid="author-document-count"] strong'
        ).should('have.text', '25');
        cy.get(
          '[data-testid="author-comparison-102"] [role="status"] svg'
        ).should('be.visible');
        cy.contains('Documents: 25').should('be.visible');
        cy.contains('Documents: 3').should('be.visible');
        cy.get('[data-testid="author-comparison-102"] [role="status"]').should(
          'have.text',
          'To keep'
        );
        cy.contains('button', /^Keep$/).should('not.exist');
      });
      cy.get('[data-testid="author-pair-101:102"]')
        .contains('button', 'Merge and delete the author')
        .should('be.enabled');
      cy.get('h1').scrollIntoView();
      cy.get('h1').should('be.visible');
      captureComparison(width);
      cy.get('[data-testid="author-pair-101:102"]')
        .contains('button', 'Merge and delete the author')
        .click();
      cy.get('[role="dialog"]').should('contain.text', 'permanently deleted');
      cy.get('[role="dialog"] button')
        .contains('Merge and delete the author')
        .should('be.visible');
      cy.document().should(doc =>
        expect(doc.documentElement.scrollWidth).to.be.at.most(
          doc.documentElement.clientWidth
        )
      );
      cy.screenshot(`author-confirmation-${width}`, { capture: 'viewport' });
      cy.get('[role="dialog"]')
        .contains('button', 'Merge and delete the author')
        .click();
      cy.wait('@merge')
        .its('request.url')
        .should('include', '/cavers/101?entityId=102');
      cy.get('[data-testid="author-merge-success-101"]')
        .should('be.visible')
        .find('a')
        .should('have.attr', 'href', '/ui/persons/102');
      cy.get('[data-testid="author-pair-101:102"]').should('not.exist');
      cy.get('[data-testid="author-pair-103:104"]').should('exist');
      cy.get('[data-testid="author-merge-success-101"]')
        .contains('button', 'Got it')
        .should('be.focused');
      cy.screenshot(`author-management-${width}`, { capture: 'fullPage' });
      cy.get('[data-testid="author-merge-success-101"]')
        .contains('button', 'Got it')
        .click();
      cy.get('[data-testid="author-merge-success-101"]').should('not.exist');
      cy.get('[data-testid="author-pair-101:102"]').should('not.exist');
    });
  });

  it('shares the compact action bar and opens the existing author preview for administrators', () => {
    visitManagement(['User', 'Moderator', 'Administrator']);
    cy.contains('button', 'Analyze', { timeout: 20000 }).click();
    cy.get('section[aria-label="Probable duplicates"]').should(
      'have.css',
      'background-color',
      'rgb(255, 255, 255)'
    );
    cy.get('[data-testid="author-pair-101:102"]')
      .contains('button', 'Compare')
      .click();
    cy.get('[data-testid="author-comparison-101"]').within(() => {
      cy.get('a[href="/ui/persons/101/edit"]')
        .should('have.attr', 'target', '_blank')
        .and(
          'have.attr',
          'aria-label',
          'Edit properties — Marie Dupont (#101) (Opens in a new tab)'
        )
        .find('svg')
        .should('be.visible');
      cy.get('[data-testid="preview-person-101"]').click();
    });
    cy.get('[role="dialog"]')
      .should('contain.text', 'Marie Dupont')
      .and('contain.text', 'Documents (25)');
    cy.get('[role="dialog"]').contains('See all documents').should('not.exist');
    cy.get('[role="dialog"] [aria-label="close"]').click();
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('allows choosing the surviving author', () => {
    visitManagement();
    cy.contains('button', 'Analyze', { timeout: 20000 }).click();
    cy.get('[data-testid="author-pair-103:104"]').within(() => {
      cy.contains('button', 'Compare').click();
      cy.get('[data-testid="author-comparison-103"]')
        .contains('button', /^Keep$/)
        .click();
      cy.contains('button', 'Merge and delete the author').click();
    });
    cy.get('[role="dialog"]')
      .contains('button', 'Merge and delete the author')
      .click();
    cy.wait('@merge')
      .its('request.url')
      .should('include', '/cavers/104?entityId=103');
    cy.get('[data-testid="author-merge-success-104"]').should('be.visible');
  });

  [
    { id: 33, label: 'Unknown author', width: 320 },
    { id: 41378, label: 'Multiple unknown authors', width: 1280 }
  ].forEach(({ id, label, width }) => {
    it(`protects #${id} and permits merging an author into it`, () => {
      const protectedAuthor = { ...people[0], id, nickname: label };
      const pairKey = [101, id].sort((a, b) => a - b).join(':');
      cy.intercept(
        { method: 'POST', pathname: '/api/v1/advanced-search' },
        { body: { results: [protectedAuthor, people[0]], totalResults: 2 } }
      );
      cy.intercept(
        { method: 'GET', pathname: `/api/v1/cavers/${id}` },
        { body: protectedAuthor }
      );
      cy.viewport(width, 900);
      visitManagement();
      cy.contains('button', 'Analyze', { timeout: 20000 }).click();
      cy.get(`[data-testid="author-pair-${pairKey}"]`).within(() => {
        cy.contains('.MuiChip-label', label).should('be.visible');
        cy.contains('button', 'Compare').click();
        cy.get(`[data-testid="author-comparison-${id}"]`).within(() => {
          cy.contains('.MuiChip-label', label).should('be.visible');
          cy.get('[role="status"]').should('have.text', 'To keep');
          cy.contains('button', 'Merge and delete the author').should(
            'not.exist'
          );
        });
        cy.contains('button', /^Keep$/).should('not.exist');
        cy.contains('button', 'Merge and delete the author').should(
          'be.enabled'
        );
      });
      cy.document().should(doc =>
        expect(doc.documentElement.scrollWidth).to.be.at.most(
          doc.documentElement.clientWidth
        )
      );
      cy.get('h1').scrollIntoView();
      cy.screenshot(`protected-author-${id}`, { capture: 'viewport' });
      cy.get(`[data-testid="author-pair-${pairKey}"]`)
        .contains('button', 'Merge and delete the author')
        .click();
      cy.get('[role="dialog"]')
        .contains('button', 'Merge and delete the author')
        .click();
      cy.wait('@merge')
        .its('request.url')
        .should('include', `/cavers/101?entityId=${id}`);
      cy.get('[data-testid="author-merge-success-101"] a').should(
        'have.attr',
        'href',
        `/ui/persons/${id}`
      );
    });
  });

  it('retains the selection when the merge fails', () => {
    cy.intercept(
      { method: 'DELETE', pathname: '/api/v1/cavers/*' },
      { statusCode: 500, body: { message: 'Internal details' } }
    );
    visitManagement();
    cy.contains('button', 'Analyze', { timeout: 20000 }).click();
    cy.get('[data-testid="author-pair-101:102"]').within(() => {
      cy.contains('button', 'Compare').click();
      cy.contains('button', 'Merge and delete the author').click();
    });
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', 'Merge and delete the author').click();
      cy.get('[role="alert"]')
        .should('contain.text', 'server error')
        .and('not.contain.text', 'Internal details');
      cy.contains('Marie D. (#102)').should('exist');
    });
  });

  it('replaces a merged Unknown pair with its result and retains the next homonym', () => {
    const homonyms = [33, 37330, 37331].map(id => ({
      id,
      type: 'AUTHOR',
      nickname: 'Unknown',
      name: 'Unknown',
      surname: 'Unknown',
      authoredCount: id === 33 ? 152 : 123,
      documents: []
    }));
    let hasMerged = false;
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/advanced-search' },
      { body: { results: homonyms, totalResults: homonyms.length } }
    );
    cy.intercept({ method: 'GET', pathname: '/api/v1/cavers/*' }, req => {
      const id = Number(new URL(req.url).pathname.split('/').pop());
      const person = homonyms.find(candidate => candidate.id === id);
      req.reply({
        body:
          hasMerged && id === 33 ? { ...person, authoredCount: 275 } : person
      });
    });
    cy.intercept({ method: 'DELETE', pathname: '/api/v1/cavers/*' }, req => {
      expect(req.url).to.include('/cavers/37330?entityId=33');
      hasMerged = true;
      req.reply({ statusCode: 204 });
    }).as('mergeUnknown');
    cy.viewport(1280, 900);
    visitManagement();
    cy.contains('button', 'Analyze', { timeout: 20000 }).click();
    cy.get('[data-testid="author-pair-33:37330"]')
      .contains('button', 'Compare')
      .click();
    cy.get('[data-testid="author-pair-33:37331"]')
      .contains('button', 'Compare')
      .click();
    cy.get('[data-testid="author-pair-33:37330"]')
      .contains('button', 'Merge and delete the author')
      .click();
    cy.get('[role="dialog"]')
      .contains('button', 'Merge and delete the author')
      .click();
    cy.wait('@mergeUnknown');
    cy.get('[data-testid="author-merge-success-37330"]')
      .should('be.visible')
      .and('contain.text', 'Unknown (#37330)')
      .and('contain.text', 'Unknown (#33)')
      .next()
      .should('have.attr', 'data-testid', 'author-pair-33:37331');
    cy.get('[data-testid="author-pair-33:37330"]').should('not.exist');
    cy.get('[data-testid="author-pair-37330:37331"]').should('not.exist');
    cy.get('[data-testid="author-pair-33:37331"]').within(() => {
      cy.contains('button', 'Close').should('exist');
      cy.contains('Documents: 275').should('exist');
    });
    cy.screenshot('unknown-merge-result', { capture: 'viewport' });
    cy.get('[data-testid="author-merge-success-37330"]')
      .contains('button', 'Got it')
      .should('be.focused')
      .click();
    cy.get('[data-testid="author-merge-success-37330"]').should('not.exist');
    cy.get('[data-testid="author-pair-33:37331"]').should('exist');
    cy.contains('button', 'Analyze').click();
    cy.get('[data-testid="author-pair-33:37331"]').should('exist');
    cy.get('[data-testid="author-pair-33:37330"]').should('not.exist');
    cy.get('@mergeUnknown.all').should('have.length', 1);
  });
});
