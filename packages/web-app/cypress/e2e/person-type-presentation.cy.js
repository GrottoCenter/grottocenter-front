const person = type => ({
  id: 42,
  nickname: 'ExamplePerson',
  name: 'Marie',
  surname: 'Dupont',
  type,
  language: 'eng',
  groups: [],
  documents: [],
  authoredCount: 0,
  organizations: [],
  exploredEntrances: []
});

const visitPerson = (type, userId = 1) => {
  cy.loginAs({ id: userId });
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/cavers/42' },
    { body: person(type) }
  ).as('getPerson');
  cy.visit('/persons/42', {
    onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
  });
  cy.wait('@getPerson', { requestTimeout: 20000 });
};

describe('Person family identity and record type', () => {
  beforeEach(() => {
    cy.mockApiCatchAll();
  });

  [
    ['CAVER', 'Caver'],
    ['AUTHOR', 'Author']
  ].forEach(([type, label]) => {
    [1280, 390].forEach(width => {
      it(`shows ${type} in properties with a shared header at ${width}px`, () => {
        cy.viewport(width, 900);
        visitPerson(type);
        cy.get('h1')
          .should('contain.text', 'Marie Dupont')
          .and('not.contain.text', 'Author');
        cy.get('h1').find('img').should('have.attr', 'alt', 'Person');
        cy.get('[data-testid="person-properties"]')
          .should('contain.text', 'Type')
          .and('contain.text', label);
        cy.get('[data-testid="person-type-label"]')
          .should('be.visible')
          .find('img')
          .should('have.attr', 'alt', '');
        if (type === 'AUTHOR') {
          cy.contains(
            'This person is a reference used to attribute documents. It is not a caver account.'
          ).should('be.visible');
        }
        cy.screenshot(`person-${type.toLowerCase()}-${width}`, {
          capture: 'viewport'
        });
      });
    });
  });

  it('retains the You badge on the current account', () => {
    visitPerson('CAVER', 42);
    cy.get('h1').should('contain.text', 'YOU');
    cy.get('[data-testid="person-type-label"]').should('have.text', 'Caver');
  });
});
