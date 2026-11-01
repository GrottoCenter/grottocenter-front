const COMMENT = {
  id: 12,
  title: 'A memorable visit',
  body: 'My visit notes.',
  author: { id: 1, nickname: 'TestCaver' },
  language: 'eng',
  isDeleted: false
};

const visitComments = ({ isExplored = false, comments = [] } = {}) => {
  cy.viewport(1280, 900);
  cy.mockApiCatchAll();
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/account' },
    { body: { id: 1, nickname: 'TestCaver', language: 'eng' } }
  );
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/languages' },
    { body: { languages: [{ id: 'eng', part1: 'en', refName: 'English' }] } }
  );
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/cavers/1' },
    { body: { id: 1, exploredEntrances: isExplored ? [{ id: 42 }] : [] } }
  );
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/entrances/42' },
    {
      body: {
        id: 42,
        name: 'Test entrance',
        latitude: 45,
        longitude: 5,
        language: 'eng',
        isDeleted: false,
        locations: [],
        descriptions: [],
        histories: [],
        riggings: [],
        documents: [],
        comments,
        cave: { id: 2, name: 'Test entrance', entrances: [{ id: 42 }] }
      }
    }
  );
  cy.loginAs();
  cy.visit('/entrances/42', {
    onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
  });
  cy.contains('[role="tab"]', 'Comments', { timeout: 20000 }).click();
};

const fillComment = () => {
  cy.get('[data-testid="comment-title"] input').type(COMMENT.title);
  cy.get('[data-testid="comment-body"] textarea').first().type(COMMENT.body);
};

const submitComment = () =>
  cy.get('[data-testid="comment-form"] button[type="submit"]').click();

describe('Comment publication and explored entrances', () => {
  it('preserves a failed publication and retries exploration without publishing twice', () => {
    visitComments();
    let publications = 0;
    let explorations = 0;
    cy.intercept({ method: 'POST', pathname: '/api/v1/comments' }, request => {
      publications += 1;
      request.reply({
        statusCode: publications === 1 ? 500 : 200,
        delay: 500,
        body: publications === 1 ? {} : COMMENT
      });
    }).as('publish');
    cy.intercept(
      { method: 'PUT', pathname: '/api/v1/entrances/42/cavers/1' },
      request => {
        explorations += 1;
        request.reply({
          statusCode: explorations === 1 ? 500 : 200,
          delay: 500,
          body: {}
        });
      }
    ).as('explore');

    cy.get('[data-testid="create-comment"]').click();
    fillComment();
    cy.get('[data-testid="comment-mark-explored"]')
      .should('not.be.checked')
      .check();
    submitComment();
    cy.get('[data-testid="comment-form"]').should(
      'have.attr',
      'aria-busy',
      'true'
    );
    cy.get('[data-testid="create-comment"]').should('be.disabled');
    cy.wait('@publish');
    cy.get('[data-testid="comment-title"] input').should(
      'have.value',
      COMMENT.title
    );
    cy.get('[data-testid="comment-body"] textarea')
      .first()
      .should('have.value', COMMENT.body);
    cy.get('[data-testid="comment-mark-explored"]').should('be.checked');
    cy.get('@explore.all').should('have.length', 0);
    submitComment();
    cy.wait('@publish');
    cy.wait('@explore');
    cy.get('[data-testid="comment-form"]').should('not.exist');
    cy.get('[data-testid="app-snackbar"]')
      .should('have.length', 1)
      .and(
        'contain',
        'Comment published, but the entrance could not be added to your explored entrances.'
      );
    cy.get('[id="comments"]').should('not.contain', 'Comment published');
    cy.viewport(390, 844);
    cy.get('[data-testid="app-snackbar"]')
      .should('be.visible')
      .then(snackbar => {
        const bounds = snackbar[0].getBoundingClientRect();
        expect(bounds.left).to.be.at.least(0);
        expect(bounds.right).to.be.at.most(390);
      });
    cy.get('[data-testid="app-snackbar"]').within(() => {
      cy.get('button[aria-label="Close"]').should('be.visible');
      cy.contains('button', 'Retry adding').click();
    });
    cy.contains('button', 'Retry adding').should('be.disabled');
    cy.wait('@explore');
    cy.contains('button', 'Retry adding').should('not.exist');
    cy.get('@publish.all').should('have.length', 2);
  });

  it('shows an existing exploration without an add option', () => {
    visitComments({ isExplored: true });
    cy.intercept(
      { method: 'POST', pathname: '/api/v1/comments' },
      { body: COMMENT }
    ).as('publish');
    cy.get('[data-testid="create-comment"]').click();
    cy.contains('Already in my explored entrances').should('be.visible');
    cy.get('[data-testid="comment-mark-explored"]').should('not.exist');
    cy.get('[data-testid="comment-form"] button[type="submit"]').should(
      'have.text',
      'Publish my comment'
    );
    fillComment();
    submitComment();
    cy.wait('@publish');
    cy.get('[data-testid="app-snackbar"]')
      .should('have.length', 1)
      .and('contain', 'Comment published.');
    cy.get('[id="comments"]').should('not.contain', 'Comment published.');
  });

  it('keeps a failed edit open and shows no exploration information when editing', () => {
    visitComments({ isExplored: true, comments: [COMMENT] });
    cy.intercept(
      { method: 'PATCH', pathname: '/api/v1/comments/12' },
      { statusCode: 500, delay: 500, body: {} }
    ).as('save');
    cy.get('button[aria-label="Edit"]').last().click();
    cy.get('[data-testid="comment-form"]').within(() => {
      cy.get('[data-testid="comment-mark-explored"]').should('not.exist');
      cy.contains('Already in my explored entrances').should('not.exist');
      cy.get('[data-testid="comment-body"] textarea').first().clear();
      cy.get('[data-testid="comment-body"] textarea')
        .first()
        .type('Corrected notes.');
      cy.get('button[type="submit"]').should('have.text', 'Save').click();
    });
    cy.wait('@save');
    cy.get('[data-testid="comment-body"] textarea')
      .first()
      .should('have.value', 'Corrected notes.');
  });
});
