const files = ['plan', 'section'].map(name => ({
  fileName: `${name}.png`,
  completePath: `https://images.example.org/originals/${name}.png`,
  thumbnails: {
    small: `https://images.example.org/thumbnails/small/${name}.png`,
    medium: `https://images.example.org/thumbnails/medium/${name}.png`,
    large: `https://images.example.org/thumbnails/large/${name}.png`
  }
}));

const document = {
  id: 234422,
  title: 'Survey with high-resolution originals',
  type: 'Image',
  isValidated: true,
  isDeleted: false,
  files,
  authors: [],
  authorsOrganization: [],
  massifs: [],
  entrances: []
};

// An image response lets the browser decode it and emit the load event.
const imageBody =
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32">' +
  '<rect width="64" height="32" fill="white"/></svg>';

describe('Document image viewer originals', () => {
  it('requests originals only in the viewer and keeps the source while zooming', () => {
    cy.viewport(1280, 900);
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      { body: { languages: [] } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/licenses' },
      { body: { licenses: [] } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/234422' },
      { body: document }
    );
    cy.intercept('https://images.example.org/thumbnails/**', {
      headers: { 'content-type': 'image/svg+xml' },
      body: imageBody
    }).as('thumbnail');
    cy.intercept('https://images.example.org/originals/**', {
      headers: { 'content-type': 'image/svg+xml' },
      body: imageBody
    }).as('original');

    cy.visit('/documents/234422', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.wait('@thumbnail');
    cy.get('img[alt="plan.png"]').should('be.visible');
    cy.get('@original.all').should('have.length', 0);
    cy.get('img[alt="plan.png"]').click();

    cy.wait('@original').its('request.url').should('eq', files[0].completePath);
    cy.get('[data-testid="lightbox-image"]')
      .should('have.attr', 'src', files[0].completePath)
      .should('be.visible')
      .and(image => expect(image[0].naturalWidth).to.be.greaterThan(0));
    cy.get('[data-testid="lightbox-image"]').trigger('wheel', { deltaY: -100 });
    cy.get('[aria-label="Reset zoom"]').should('contain', '120%');
    cy.get('[data-testid="lightbox-image"]').should(
      'have.attr',
      'src',
      files[0].completePath
    );
    cy.get('@original.all').should('have.length', 1);

    cy.get('[aria-label="Next image"]').click();
    cy.wait('@original').its('request.url').should('eq', files[1].completePath);
    cy.get('[data-testid="lightbox-image"]')
      .should('have.attr', 'src', files[1].completePath)
      .should('be.visible');
    cy.get('@original.all').should('have.length', 2);
  });
});
