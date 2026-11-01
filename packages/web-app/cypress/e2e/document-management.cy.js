const documents = [
  {
    id: 1,
    type: 'Book',
    title: 'Linked PDF',
    identifierType: 'url',
    identifier: 'https://example.org/book.pdf',
    identifierPdfPageOffset: null
  },
  {
    id: 2,
    type: 'Issue',
    title: 'Attached PDF',
    files: [
      {
        id: 10,
        fileName: 'bulletin.pdf',
        completePath: 'https://example.org/bulletin.pdf',
        pdfPageOffset: null
      }
    ]
  },
  {
    id: 3,
    type: 'Text',
    title: 'Excluded text',
    files: [
      {
        id: 11,
        fileName: 'mapped.pdf',
        completePath: 'https://example.org/mapped.pdf',
        pdfPageOffset: null
      }
    ]
  },
  {
    id: 4,
    type: 'Article',
    title: 'Excluded article',
    identifierType: 'url',
    identifier: 'https://example.org/article.pdf'
  }
];

describe('Document PDF offset management', () => {
  it('analyzes all remaining documents without pausing at the next thousand', () => {
    cy.viewport(1280, 900);
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.loginAs({ groups: ['User', 'Moderator'] });
    const matches = Array.from({ length: 2001 }, (_, index) => ({
      ...([0, 1000, 2000].includes(index) ? documents[0] : { type: 'Book' }),
      id: index + 1,
      title: `PDF ${index + 1}`
    }));
    const bookSkips = [];
    cy.intercept(
      {
        method: 'GET',
        pathname: '/api/v1/documents',
        query: { isValidated: 'true' }
      },
      req => {
        const isBook = req.query.documentType === 'Book';
        const skip = Number(req.query.skip);
        if (isBook) bookSkips.push(skip);
        const rows = isBook
          ? matches.slice(skip, skip + Number(req.query.limit))
          : [];
        req.reply({
          headers: {
            'Content-Range': `${skip}-${skip + rows.length}/${isBook ? matches.length : 0}`
          },
          body: { documents: rows }
        });
      }
    );
    cy.visit('/documents/management', {
      onBeforeLoad: win => {
        win.localStorage.setItem('selectedLanguage', 'en');
        win.localStorage.removeItem('documentManagement.ignoredPdfOffsets');
      }
    });
    cy.contains('button', 'Analyze').click();
    cy.get('[data-testid="document-offset-row-1"]', { timeout: 30000 }).should(
      'exist'
    );
    cy.get('[data-testid="document-offset-row-1001"]').should('not.exist');
    cy.contains('button', /^Analyze$/).should('not.exist');
    cy.then(() =>
      expect(bookSkips).to.deep.equal(
        Array.from({ length: 10 }, (_, index) => index * 100)
      )
    );
    cy.contains('button', 'Analyze all').click();
    cy.get('[data-testid="document-offset-row-1001"]').should('exist');
    cy.get('[data-testid="document-offset-row-2001"]', {
      timeout: 30000
    }).should('exist');
    cy.then(() =>
      expect(bookSkips).to.deep.equal(
        Array.from({ length: 21 }, (_, index) => index * 100)
      )
    );
    cy.contains('button', 'Continue analysis').should('not.exist');
    cy.contains('button', /^Analyze$/).should('be.visible');
  });

  [390, 1280].forEach(width => {
    it(`lists missing PDF offsets for moderators at ${width}px`, () => {
      cy.viewport(width, 900);
      cy.disableServiceWorker();
      cy.mockApiCatchAll();
      cy.loginAs({ groups: ['User', 'Moderator'] });
      cy.intercept(
        {
          method: 'GET',
          pathname: '/api/v1/documents',
          query: { isValidated: 'true' }
        },
        req => {
          expect(['Issue', 'Book']).to.include(req.query.documentType);
          const filtered = documents.filter(
            document => document.type === req.query.documentType
          );
          req.reply({
            headers: {
              'Content-Range': `0-${filtered.length}/${filtered.length}`
            },
            body: { documents: filtered }
          });
        }
      ).as('documents');
      cy.visit('/documents/management', {
        onBeforeLoad: win => {
          win.localStorage.setItem('selectedLanguage', 'en');
          win.localStorage.removeItem('documentManagement.ignoredPdfOffsets');
        }
      });
      cy.get('[data-testid="document-offset-row-1"]').should('not.exist');
      cy.contains('button', 'Analyze').click();
      cy.wait('@documents');
      cy.get('[data-testid="document-offset-row-1"]').within(() => {
        cy.contains('a', 'Linked PDF')
          .should('have.attr', 'href', '/ui/documents/1')
          .and('have.attr', 'target', '_blank');
        cy.contains('a', 'https://example.org/book.pdf').should('not.exist');
        cy.contains('a', 'Edit document')
          .should('have.attr', 'href', '/ui/documents/1/edit')
          .and('have.attr', 'target', '_blank');
      });
      cy.get('[data-testid="document-offset-row-2"]').should('be.visible');
      cy.get('[data-testid="document-offset-row-3"]').should('not.exist');
      cy.get('[data-testid="document-offset-row-4"]').should('not.exist');
      cy.get('[data-testid="documents-scan-progress"]').should(
        'contain.text',
        'Documents scanned: 2 of 2'
      );
      cy.document().then(doc => {
        expect(doc.documentElement.scrollWidth).to.be.at.most(width);
      });
      cy.get('[data-testid="document-offset-row-1"]').within(() => {
        cy.contains('button', 'Ignore').click();
      });
      cy.get('[data-testid="document-offset-row-1"]').should('not.exist');
      cy.reload();
      cy.contains('button', 'Analyze').click();
      cy.get('[data-testid="document-offset-row-2"]').should('be.visible');
      cy.get('[data-testid="document-offset-row-1"]').should('not.exist');
      cy.contains('button', 'Show ignored').click();
      cy.get('[data-testid="document-offset-row-1"]').should('be.visible');
    });
  });
});
