import messages from '../../public/lang/fr.json';
import { documentTypes } from '../fixtures/document-types.json';

describe('Document type descriptions', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/account' },
      { body: { id: 1, nickname: 'TestCaver', language: 'fra' } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/types' },
      { fixture: 'document-types.json' }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      { body: { languages: [{ id: 'fra', part1: 'fr', refName: 'French' }] } }
    );
    [
      ['documents/identifierTypes', 'identifierTypes'],
      ['documents/subjects', 'subjects'],
      ['file-formats', 'fileFormats'],
      ['licenses', 'licenses'],
      ['documents', 'documents']
    ].forEach(([path, key]) => {
      cy.intercept(
        { method: 'GET', pathname: `/api/v1/${path}` },
        { body: { [key]: [] } }
      );
    });
    cy.loginAs();
  });

  [390, 1280].forEach(width => {
    it(`shows descriptions without hover or clipped text at ${width}px`, () => {
      cy.viewport(width, 900);
      cy.visit('/entity/add/document', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'fr')
      });
      cy.get('[data-testid="document-type-4"]', { timeout: 60000 }).should(
        'be.visible'
      );
      cy.get('[data-testid="document-type-4"]').click();
      cy.get('[data-testid="document-type-4"]')
        .should('have.attr', 'aria-pressed', 'true')
        .find('[data-testid="document-type-selected"]')
        .should('be.visible');
      cy.get('[data-testid="document-type-4"]').then(([firstCard]) => {
        const firstIcon = firstCard
          .querySelector('[data-testid="document-type-icon"]')
          .getBoundingClientRect();
        const firstTitle = firstCard
          .querySelector('[data-testid="document-type-name"]')
          .getBoundingClientRect();
        [21, 13].forEach(id => {
          cy.get(`[data-testid="document-type-${id}"]`).should(([card]) => {
            const icon = card
              .querySelector('[data-testid="document-type-icon"]')
              .getBoundingClientRect();
            const title = card
              .querySelector('[data-testid="document-type-name"]')
              .getBoundingClientRect();
            expect(icon.top).to.be.closeTo(firstIcon.top, 1);
            expect(title.top).to.be.closeTo(firstTitle.top, 1);
            expect(icon.left).to.be.greaterThan(firstIcon.right);
            expect(
              card.ownerDocument.defaultView.getComputedStyle(
                card.querySelector('[data-testid="document-type-name"]')
              ).fontWeight
            ).to.equal('600');
          });
        });
      });
      cy.screenshot(`document-types-initial-${width}`, {
        capture: 'viewport'
      });
      if (width < 600) {
        cy.get('[data-testid="document-other-types-toggle"]').click();
      }

      cy.get('#document-other-types [aria-pressed]').should(cards => {
        const names = Array.from(
          cards,
          card =>
            card.querySelector('[data-testid="document-type-name"]').textContent
        );
        expect(names).to.deep.equal([
          'Article',
          'Livre',
          'Collection',
          'Numéro',
          'Texte',
          'Carte',
          'Données topographiques',
          'Jeu de données',
          'Vidéo',
          'Audio',
          'Ressource interactive',
          'Logiciel',
          'Objet physique',
          'Évènement',
          'Service',
          'Autorisation de publication'
        ]);
      });

      documentTypes.forEach(docType => {
        cy.get(`[data-testid="document-type-${docType.id}"]`).scrollIntoView();
        if (docType.name === 'Book') {
          cy.get(`[data-testid="document-type-${docType.id}"]`)
            .should('contain.text', messages.Book)
            .find('[data-testid="document-type-description"]')
            .should('not.exist');
          return;
        }
        cy.get(`[data-testid="document-type-${docType.id}"]`)
          .should('contain.text', messages[docType.name])
          .find('[data-testid="document-type-description"]')
          .should('be.visible')
          .and('not.be.empty')
          .should(([paragraph]) => {
            expect(paragraph.scrollWidth).to.be.at.most(
              paragraph.clientWidth + 1
            );
            expect(paragraph.scrollHeight).to.be.at.most(
              paragraph.clientHeight + 1
            );
            const lineHeight = parseFloat(
              paragraph.ownerDocument.defaultView.getComputedStyle(paragraph)
                .lineHeight
            );
            const maxLines =
              width < 600 && [4, 12, 13, 21].includes(docType.id) ? 3 : 2;
            expect(paragraph.clientHeight).to.be.at.most(
              lineHeight * maxLines + 1
            );
          });
      });

      [
        [1, 'Ensemble de revues'],
        [20, 'Accord de diffusion et licence'],
        [12, 'Notice, fiche, document autonome…'],
        [10, 'Audio']
      ].forEach(([id, text]) => {
        cy.get(`[data-testid="document-type-${id}"]`).should(
          'contain.text',
          text
        );
      });

      cy.get('[data-testid="document-type-2"]').scrollIntoView();
      cy.get('[data-testid="document-type-2"]')
        .should('contain.text', 'Mesures, relevés, tableaux…')
        .and('not.contain.text', '3D')
        .and('not.contain.text', 'GLB');
      cy.get('[data-testid="document-type-5"]').should(
        'contain.text',
        'Vue 3D, visite virtuelle'
      );
      cy.get('[data-testid="document-type-7"]').should(
        'contain.text',
        'Objet matériel, échantillon'
      );
      cy.get('[role="tooltip"]').should('not.exist');
      cy.screenshot(`document-type-descriptions-${width}`, {
        capture: 'viewport'
      });
      cy.get('[data-testid="document-type-2"]').click();
      cy.get('[data-testid="document-type-2"]')
        .should('have.attr', 'aria-pressed', 'true')
        .find('[data-testid="document-type-selected"]')
        .should('be.visible');
      if (width < 600) {
        cy.get('[data-testid="document-other-types-toggle"]')
          .should('have.attr', 'aria-expanded', 'true')
          .and('contain.text', 'Jeu de données')
          .click();
        cy.get('[data-testid="document-other-types-toggle"]')
          .should('have.attr', 'aria-expanded', 'false')
          .and('contain.text', 'Jeu de données');
        cy.get('[data-testid="document-type-2"]').should('not.be.visible');
        cy.get('[data-testid="document-other-types-toggle"]').click();
      }
      cy.get('[data-testid="document-type-2"]')
        .should('be.visible')
        .find('[data-testid="document-type-name"]')
        .should(([name]) => {
          expect(
            name.ownerDocument.defaultView.getComputedStyle(name).color
          ).to.equal('rgba(0, 0, 0, 0.95)');
        });
      cy.screenshot(`document-type-selected-${width}`, {
        capture: 'viewport'
      });
    });
  });
});
