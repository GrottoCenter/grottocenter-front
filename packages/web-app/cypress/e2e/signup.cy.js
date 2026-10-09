describe('Account creation form', () => {
  beforeEach(() => {
    cy.mockApiCatchAll();
    cy.viewport(375, 812);
    cy.visit('/signup', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'fr')
    });
  });

  it('explains optional names once and keeps API input limits', () => {
    cy.get('[data-testid="signup-form"]').within(() => {
      cy.contains(
        'Indiquer vos prénom et nom aide les autres spéléologues à vous retrouver et à vous citer comme auteur.'
      ).should('be.visible');
      cy.get('[data-testid="signup-nickname"] input')
        .should('have.attr', 'maxlength', '68')
        .and('have.attr', 'required');
      cy.get('[data-testid="signup-name"] input')
        .should('have.attr', 'maxlength', '36')
        .and('not.have.attr', 'required');
      cy.get('[data-testid="signup-surname"] input')
        .should('have.attr', 'maxlength', '32')
        .and('not.have.attr', 'required');
      cy.contains('Votre véritable prénom (optionnel).').should('not.exist');
      cy.contains('Votre véritable nom de famille (optionnel).').should(
        'not.exist'
      );
    });
  });

  it('uses a full-width mobile submit button with a 48px touch target', () => {
    cy.get('[data-testid="signup-submit"]').scrollIntoView();
    cy.get('[data-testid="signup-submit"]').should('be.visible');
    cy.get('[data-testid="signup-form"]').then($form => {
      cy.get('[data-testid="signup-submit"]').should($button => {
        expect($button[0].getBoundingClientRect().width).to.be.closeTo(
          $form[0].getBoundingClientRect().width,
          1
        );
        expect($button[0].getBoundingClientRect().height).to.be.at.least(48);
      });
    });
    cy.viewport(1280, 900);
    cy.get('[data-testid="signup-submit"]').should($button => {
      expect($button[0].getBoundingClientRect().width).to.be.lessThan(500);
    });
  });
});
