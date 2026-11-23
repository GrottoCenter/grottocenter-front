const document = {
  id: 7,
  title: 'Survey for moderation',
  type: 'Event',
  dateInscription: '2026-01-01T00:00:00Z',
  isValidated: false,
  validationStatus: 'pending',
  dateValidation: null,
  validator: null,
  authors: [],
  authorsOrganization: [],
  files: [],
  entrances: [],
  massifs: [],
  mainLanguage: 'eng'
};

const visitDocument = (state, language = 'en') => {
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/documents/7' },
    { body: { ...document, ...state } }
  ).as('document');
  cy.visit('/documents/7', {
    onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', language)
  });
  cy.wait('@document');
  cy.contains('h1', document.title, { timeout: 30000 }).should('be.visible');
};

describe('Document moderation notice', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/7/children' },
      { body: { documents: [] } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      { body: { languages: [{ id: 'eng', part1: 'en', refName: 'English' }] } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/licenses' },
      { body: { licenses: [] } }
    );
    cy.loginAs();
  });

  [390, 1280].forEach(width => {
    it(`distinguishes a pending creation at ${width}px`, () => {
      cy.viewport(width, 900);
      visitDocument({});
      cy.get('[data-testid="document-moderation-notice"]')
        .should('be.visible')
        .and('have.class', 'MuiAlert-colorWarning')
        .and(
          'contain.text',
          'This document is awaiting validation by a moderator.'
        )
        .and('not.contain.text', 'last modification')
        .and('not.contain.text', 'rejected');
    });

    it(`shows a refusal and its plain-text reason at ${width}px`, () => {
      cy.viewport(width, 900);
      visitDocument({
        validationStatus: 'rejected',
        dateValidation: '2026-10-18T12:00:00Z',
        validator: { id: 9, nickname: 'Moderator' },
        validatorComment: `<b>Wrong entrance</b>\n${'Long reason '.repeat(35)}`
      });
      cy.get('[data-testid="document-moderation-notice"]')
        .should('be.visible')
        .and('have.class', 'MuiAlert-colorError')
        .and('contain.text', 'This document has been rejected.')
        .and('contain.text', 'Reason: <b>Wrong entrance</b>')
        .and('contain.text', 'Decision on October 18, 2026')
        .and('not.contain.text', 'awaiting validation')
        .and('not.contain.text', 'A moderator needs to validate')
        .find('b')
        .should('not.exist');
      cy.document().then(page => {
        expect(page.documentElement.scrollWidth).to.be.at.most(width);
      });
      cy.screenshot(`document-moderation-refused-${width}`, {
        capture: 'viewport'
      });
    });
  });

  it('preserves the notice for a pending modification', () => {
    visitDocument({
      validationStatus: 'modificationPending',
      validator: { id: 9, nickname: 'Moderator' }
    });
    cy.get('[data-testid="document-moderation-notice"]')
      .should(
        'contain.text',
        'A moderator needs to validate the last modification before being able to edit the document again.'
      )
      .and('have.class', 'MuiAlert-colorInfo');
  });

  it('does not show an old refusal on the accepted version', () => {
    visitDocument({
      isValidated: true,
      validationStatus: 'validated',
      dateValidation: '2026-10-18T12:00:00Z',
      validatorComment: 'Proposed modification refused'
    });
    cy.get('[data-testid="document-moderation-notice"]').should('not.exist');
    cy.get('[data-testid="document-validation-badge"]').should('not.exist');
  });

  it('shows first validation for a corrected submission despite previous refusal metadata', () => {
    visitDocument({
      validationStatus: 'pending',
      validator: { id: 9, nickname: 'Moderator' },
      dateValidation: '2026-10-18T12:00:00Z',
      validatorComment: 'Old refusal'
    });
    cy.get('[data-testid="document-validation-badge"]')
      .should('contain.text', 'Awaiting validation')
      .and('have.class', 'MuiChip-colorWarning');
    cy.get('[data-testid="document-moderation-notice"]')
      .should(
        'contain.text',
        'This document is awaiting validation by a moderator.'
      )
      .and('not.contain.text', 'last modification')
      .and('not.contain.text', 'Old refusal');
  });

  it('does not infer a state from legacy fields when the status is absent', () => {
    visitDocument({
      validationStatus: undefined,
      dateValidation: '2026-10-18T12:00:00Z'
    });
    cy.get('[data-testid="document-validation-badge"]').should('not.exist');
    cy.get('[data-testid="document-moderation-notice"]').should('not.exist');
  });

  it('renders the refusal and decision date in French', () => {
    visitDocument(
      {
        validationStatus: 'rejected',
        dateValidation: '2026-10-18T12:00:00Z',
        validatorComment: 'Mauvaise entrée'
      },
      'fr'
    );
    cy.get('[data-testid="document-moderation-notice"]')
      .should('contain.text', 'Ce document a été refusé.')
      .and('contain.text', 'Motif : Mauvaise entrée')
      .and('contain.text', 'Décision du 18 octobre 2026');
  });
});
