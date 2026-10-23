const people = [
  { id: '2', nickname: 'Known caver', type: 'CAVER', _type: 'persons' },
  { id: '3', nickname: 'Known author', type: 'AUTHOR', _type: 'persons' },
  { id: '4', nickname: 'Unclassified reference', _type: 'persons' }
];

const document = {
  id: 42,
  title: 'Document with mixed authors',
  type: 'Event',
  datePublication: '2026-01-01',
  mainLanguage: 'eng',
  isValidated: true,
  authors: people.map(({ id, nickname, type }) => ({
    id: Number(id),
    nickname,
    type
  })),
  authorsOrganization: [{ id: 11, name: 'A club', type: 'SPELEOLOGY' }],
  editor: { id: 12, name: 'An editor', type: 'EDITION' },
  library: { id: 13, name: 'A library', type: 'LIBRARY' },
  files: [],
  entrances: [],
  massifs: []
};

const visit = path => {
  cy.loginAs();
  cy.visit(path, {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', 'en');
      win.localStorage.removeItem('entityTable_persons_columns');
    }
  });
};

const assertIcon = (selector, icon) => {
  cy.readFile(`src/assets/icons/${icon}.svg`).then(expectedSvg => {
    const parser = new DOMParser();
    const expectedPath = parser
      .parseFromString(expectedSvg, 'image/svg+xml')
      .querySelector('path:last-of-type')
      .getAttribute('d');
    cy.get(selector)
      .find('img')
      .should('have.length', 1)
      .and($img => {
        const src = $img.attr('src');
        if (src.startsWith('data:')) {
          const separator = src.indexOf(',');
          const payload = src.slice(separator + 1);
          const svg = src.slice(0, separator).endsWith(';base64')
            ? atob(payload)
            : decodeURIComponent(payload);
          expect(svg).to.include(expectedPath);
        } else {
          expect(src).to.include(`${icon}.svg`);
        }
      });
  });
};

const assertNoPersonRequests = () => {
  people.forEach(({ id }) => {
    cy.get(`@person${id}.all`).should('have.length', 0);
  });
};

describe('Entity family identities and useful author types', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.mockApiCatchAll();
    cy.intercept('GET', '**/api/v1/languages', {
      languages: [{ id: 'eng', refName: 'English', part1: 'en' }]
    });
    cy.intercept('GET', '**/api/v1/documents/types', {
      documentTypes: [{ id: 1, name: 'Event' }]
    });
    cy.intercept('GET', '**/api/v1/documents/42', document).as('document');
    people.forEach(person => {
      cy.intercept('GET', `**/api/v1/cavers/${person.id}`, {
        ...person,
        documents: [],
        organizations: [],
        exploredEntrances: [],
        authoredCount: 0
      }).as(`person${person.id}`);
    });
    cy.intercept('POST', '**/api/v1/advanced-search', req => {
      const results = people.filter(
        person => !req.body.filter?.type || person.type === req.body.filter.type
      );
      req.reply({
        results,
        totalResults: results.length,
        totalEntities: results.length,
        page: 1
      });
    }).as('search');
  });

  [1280, 390].forEach(width => {
    it(`keeps the Persons identity while filtering or resetting at ${width}px`, () => {
      cy.viewport(width, 900);
      visit('/persons');
      cy.wait('@search').its('request.body.filter.type').should('eq', 'CAVER');
      cy.get('h1')
        .should('have.text', 'Persons')
        .find('img')
        .should('have.attr', 'alt', 'Person');
      cy.get('[data-testid="entity-type-filter"]')
        .contains('[role="button"]', 'Cavers')
        .should('have.attr', 'aria-pressed', 'true');
      cy.contains('Known caver').should('be.visible');
      cy.contains('Known author').should('not.exist');
      cy.get('[data-testid="entity-type-filter"]').contains('All').click();
      cy.wait('@search').its('request.body.filter').should('deep.equal', {});
      cy.contains('Known author').should('be.visible');
      if (width === 1280) {
        assertIcon('tr:contains("Known caver")', 'caver');
        assertIcon('tr:contains("Known author")', 'author');
        cy.contains('tr', 'Unclassified reference')
          .find('img')
          .should('not.exist');
      }
      cy.get('[data-testid="entity-type-filter"]').contains('Authors').click();
      cy.wait('@search').its('request.body.filter.type').should('eq', 'AUTHOR');
      cy.get('h1').should('have.text', 'Persons');
      cy.contains('button', 'Clear all').click();
      cy.wait('@search').its('request.body.filter.type').should('eq', 'CAVER');
      cy.get('[data-testid="entity-type-filter"]')
        .contains('[role="button"]', 'Cavers')
        .should('have.attr', 'aria-pressed', 'true');
      cy.screenshot(`persons-family-${width}`, { capture: 'viewport' });
    });
  });

  it('respects an explicit author link and resets to Cavers without changing the family title', () => {
    visit('/persons?type=AUTHOR');
    cy.wait('@search').its('request.body.filter.type').should('eq', 'AUTHOR');
    cy.get('h1').should('have.text', 'Persons');
    cy.get('[data-testid="entity-type-filter"]')
      .contains('[role="button"]', 'Authors')
      .should('have.attr', 'aria-pressed', 'true');
    cy.contains('button', 'Clear all').click();
    cy.wait('@search').its('request.body.filter.type').should('eq', 'CAVER');
  });

  it('uses supplied author types and falls back without fetching people', () => {
    visit('/documents/42');
    cy.wait('@document');
    cy.get('a[href="/ui/persons/2"]').should('contain.text', 'Caver');
    assertIcon('a[href="/ui/persons/2"]', 'caver');
    cy.get('a[href="/ui/persons/3"]').should('contain.text', 'Author');
    assertIcon('a[href="/ui/persons/3"]', 'author');
    cy.get('a[href="/ui/persons/4"]').should(
      'have.text',
      'Unclassified reference'
    );
    assertIcon('a[href="/ui/persons/4"]', 'person');
    assertIcon('a[href="/ui/organizations/11"]', 'organization');
    [12, 13].forEach(id => {
      assertIcon(
        `span:has(> a[href="/ui/organizations/${id}"])`,
        'organization'
      );
    });
    assertNoPersonRequests();
    cy.screenshot('document-author-types', { capture: 'viewport' });
  });

  it('preserves author types while selecting additional authors in the document form', () => {
    cy.intercept('POST', '**/api/v1/search', {
      results: [
        { id: '5', nickname: 'New author', type: 'AUTHOR', _type: 'persons' }
      ]
    }).as('suggestions');
    visit('/documents/42/edit');
    cy.wait('@document');
    cy.get('[data-testid="document-authors"]')
      .should('contain.text', 'Known caver')
      .and('contain.text', '(Caver)')
      .and('contain.text', '(Author)')
      .and('not.contain.text', '(unknown)');
    cy.get('[data-testid="document-authors"] input[role="combobox"]').type(
      'new'
    );
    cy.wait('@suggestions');
    cy.get('[data-testid="document-authors"] input[role="combobox"]').should(
      'have.value',
      'new'
    );
    cy.get('[role="listbox"]').contains('New author').click();
    cy.get('[data-testid="document-authors"]')
      .should('contain.text', 'New author')
      .and('contain.text', '(Author)');
    assertNoPersonRequests();
    cy.screenshot('selected-document-author-types', { capture: 'viewport' });
  });
});
