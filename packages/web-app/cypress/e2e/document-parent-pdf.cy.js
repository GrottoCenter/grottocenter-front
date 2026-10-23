const parentUrl = 'https://documents.example.org/issue.pdf';
const articleUrl = 'https://documents.example.org/article.pdf';

const document = {
  id: 7,
  title: 'Article using its parent PDF',
  type: 'Article',
  pages: '2-3',
  isValidated: true,
  isDeleted: false,
  files: [],
  authors: [],
  authorsOrganization: [],
  massifs: [],
  entrances: [],
  parent: {
    id: 8,
    type: 'Issue',
    title: 'Parent issue',
    identifier: parentUrl,
    identifierType: 'url'
  }
};

const visitArticle = (overrides = {}, isNativeViewerUsed = true) => {
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/documents/7' },
    { body: { ...document, ...overrides } }
  ).as('document');
  cy.visit('/documents/7', {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', 'en');
      // Exercise source selection independently of browser PDF support. PDF.js
      // rendering and cross-origin server permissions are separate concerns.
      Object.defineProperty(win.navigator, 'pdfViewerEnabled', {
        configurable: true,
        value: isNativeViewerUsed
      });
    }
  });
  cy.wait('@document', { requestTimeout: 30000 });
  cy.contains('h1', document.title, { timeout: 30000 }).should('be.visible');
};

describe('Article PDF from its parent', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/7/children' },
      { body: { documents: [] } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      { body: { languages: [] } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/licenses' },
      { body: { licenses: [] } }
    );
    cy.intercept('https://documents.example.org/*.pdf', {
      fixture: 'article-pages.pdf,null',
      headers: {
        'content-type': 'application/pdf',
        'access-control-allow-origin': '*'
      }
    });
  });

  it('uses the parent URL identifier when the article has no PDF', () => {
    visitArticle();

    cy.get('object[type="application/pdf"]').should(
      'have.attr',
      'data',
      `${parentUrl}#page=2`
    );
    cy.contains(
      '[role="alert"]',
      'This PDF is displayed from an external website.'
    ).should('be.visible');
    // The only direct link is the viewer fallback, not a duplicate URL row.
    cy.get(`a[href="${parentUrl}#page=2"]`)
      .should('have.length', 1)
      .and('contain', 'Open PDF');
  });

  it('prefers the article URL over its parent URL', () => {
    visitArticle({ identifier: articleUrl, identifierType: 'url' });

    cy.get('object[type="application/pdf"]').should(
      'have.attr',
      'data',
      articleUrl
    );
  });

  it('supports the previous response shape without parent identifiers', () => {
    visitArticle({ parent: { id: 8, type: 'Issue', title: 'Parent issue' } });

    cy.get('object[type="application/pdf"]').should('not.exist');
    cy.contains('No files attached to this document.').should('be.visible');
  });

  it('renders the article page in the PDF.js viewer used on mobile', () => {
    cy.viewport(390, 844);
    visitArticle({}, false);

    cy.get('canvas[aria-label="Page 2 of 3"]', { timeout: 30000 })
      .should('be.visible')
      .and(([canvas]) => {
        const pixel = canvas
          .getContext('2d')
          .getImageData(
            Math.floor(canvas.width / 2),
            Math.floor(canvas.height / 2),
            1,
            1
          ).data;
        // The fixture's second page is green; the first and third are red/blue.
        expect(Array.from(pixel)).to.deep.equal([0, 255, 0, 255]);
      });
    cy.contains('Page 2 of 3').should('be.visible');
    cy.get('object[type="application/pdf"]').should('not.exist');
  });
});
