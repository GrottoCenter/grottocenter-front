const files = [
  {
    id: 101,
    fileName:
      'Applications of Electronic-Nose Technologies for Noninvasive Earl.pdf',
    completePath: 'https://documents.example.org/article.pdf',
    pdfPageOffset: 1
  },
  {
    id: 102,
    fileName: 'Bulletin_CNM_1990.pdf',
    completePath: 'https://documents.example.org/bulletin.pdf',
    pdfPageOffset: null
  }
];

describe('Document attachment list', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/7' },
      {
        body: {
          id: 7,
          type: 'Book',
          title: 'Document de test',
          description: 'Description',
          isValidated: true,
          isDeleted: false,
          authors: [{ id: 1, nickname: 'TestCaver' }],
          authorsOrganization: [],
          files,
          mainLanguage: 'fra',
          license: 'CC-BY-SA',
          option: 'Author created this document'
        }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/types' },
      {
        body: { documentTypes: [{ id: 1, name: 'Book' }] }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      {
        body: { languages: [{ id: 'fra', part1: 'fr', refName: 'French' }] }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/licenses' },
      {
        body: { licenses: [{ id: 1, name: 'CC-BY-SA' }] }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/file-formats' },
      {
        body: {
          fileFormats: [
            { extension: 'pdf', mimeType: 'application/pdf' },
            { extension: 'jpg', mimeType: 'image/jpeg' },
            { extension: 'png', mimeType: 'image/png' },
            { extension: 'zip', mimeType: 'application/zip' }
          ]
        }
      }
    );
    cy.loginAs();
  });

  [
    [1280, 900, 'desktop'],
    [390, 844, 'mobile']
  ].forEach(([width, height, label]) => {
    it(`groups file actions and pagination on ${label}`, () => {
      cy.viewport(width, height);
      cy.visit('/documents/7/edit', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'fr')
      });
      cy.get('[data-testid="selected-files"]', { timeout: 30000 }).should(
        'be.visible'
      );
      if (label === 'mobile') {
        cy.get('[data-testid="accepted-formats-toggle"]')
          .should('have.text', 'Formats acceptés')
          .parent()
          .as('acceptedFormats')
          .should('not.have.attr', 'open');
        cy.get('[data-testid="accepted-formats-toggle"]').click();
        cy.get('@acceptedFormats').should('have.attr', 'open');
        cy.get('@acceptedFormats')
          .contains('jpg, pdf, png, zip')
          .should('be.visible');
        cy.get('[data-testid="accepted-formats-toggle"]').click();
        cy.get('@acceptedFormats').should('not.have.attr', 'open');
        cy.get('[data-testid="file-picker"]').should(([button]) => {
          expect(button.getBoundingClientRect().height).to.be.at.least(48);
        });
      } else {
        cy.get('[data-testid="accepted-formats-toggle"]').should('not.exist');
        cy.get('[data-testid="file-dropzone"]')
          .contains('jpg, pdf, png, zip')
          .should('be.visible');
      }
      cy.get(`[data-testid="selected-file-${files[0].fileName}"]`).within(
        () => {
          cy.get('[data-testid="open-selected-file"]')
            .should('have.attr', 'href', files[0].completePath)
            .and('have.attr', 'target', '_blank');
          cy.get('[data-testid="remove-selected-file"]').should('be.visible');
          cy.get('[data-testid="selected-file-name"]')
            .should('have.text', files[0].fileName)
            .and('be.visible');
          cy.get('[data-testid="file-type-icon"] svg').should('be.visible');
          cy.get('[data-testid="pdf-pagination-toggle"]').should('be.visible');
          cy.contains('Pagination ajustée').should('be.visible');
        }
      );
      cy.get(`[data-testid="selected-file-${files[1].fileName}"]`).within(
        () => {
          cy.get('[data-testid="pdf-pagination-toggle"]').click();
          cy.get('input[type="number"]')
            .first()
            .should('have.attr', 'name', 'printedPage');
          cy.contains('a', 'Ouvrez le PDF')
            .should('have.attr', 'href', files[1].completePath)
            .and('have.attr', 'target', '_blank');
          cy.contains('Page du PDF correspondante').should('be.visible');
          cy.get('input[name="printedPage"]').type('10');
          cy.get('input[name="pdfPage"]').type('11');
          cy.get('[data-testid="pdf-pagination-actions"]')
            .find('a, button')
            .should(elements => {
              expect(
                [...elements].map(element => element.textContent)
              ).to.deep.equal(['Tester', 'Effacer', 'OK']);
            });
          cy.contains('a', 'Tester').should(
            'have.attr',
            'href',
            `${files[1].completePath}#page=11`
          );
          cy.get('[data-testid="pdf-pagination-toggle"]').should(
            'have.attr',
            'aria-expanded',
            'true'
          );
        }
      );
      cy.contains('y compris depuis ses articles').should('not.exist');
      cy.get(`[data-testid="selected-file-${files[1].fileName}"]`)
        .find('[data-testid="pdf-pagination-help"]')
        .click();
      cy.contains('y compris depuis ses articles').should('be.visible');
      cy.get('body').type('{esc}');
      cy.contains('y compris depuis ses articles').should('not.exist');
      cy.get('[data-testid="selected-files"]').should(([list]) => {
        const bounds = list.getBoundingClientRect();
        expect(bounds.width).to.be.at.most(width);
        expect(list.scrollWidth).to.be.at.most(list.clientWidth);
      });
      // Leave enough vertical space to capture both attachments in the app's
      // fixed scrolling pane. Width and responsive behavior stay unchanged.
      cy.viewport(width, 1200);
      cy.get('[data-testid="selected-files"]').scrollIntoView({
        offset: { top: -150, left: 0 }
      });
      cy.get('[data-testid="selected-files"]').screenshot(
        `document-files-${label}`
      );
      cy.viewport(width, height);
      cy.get(`[data-testid="selected-file-${files[1].fileName}"]`).within(
        () => {
          cy.contains('button', 'OK').click();
          cy.contains('Pagination ajustée').should('be.visible');
          cy.get('[data-testid="pdf-pagination-toggle"]').should(
            'have.attr',
            'aria-expanded',
            'false'
          );
          cy.get('[data-testid="pdf-pagination-toggle"]').click();
          cy.contains('button', 'Effacer').click();
          cy.contains('Pagination ajustée').should('not.exist');
          cy.get('[data-testid="remove-selected-file"]').click();
        }
      );
      cy.get(`[data-testid="selected-file-${files[1].fileName}"]`).should(
        'not.exist'
      );
      cy.get(`[data-testid="selected-file-${files[0].fileName}"]`).should(
        'exist'
      );
    });
  });
});
