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

const expectImageFit = (zoom = 1) => {
  cy.get('[data-testid="lightbox-image"]').should(([image]) => {
    expect(image.naturalWidth).to.equal(200);
    expect(image.naturalHeight).to.equal(400);
    expect(getComputedStyle(image).backgroundColor).to.equal(
      'rgb(255, 255, 255)'
    );
    const viewport = image.parentElement.getBoundingClientRect();
    const bounds = image.getBoundingClientRect();
    const scale = Math.min(viewport.width / 200, viewport.height / 400);
    expect(bounds.width).to.be.closeTo(200 * scale * zoom, 1);
    expect(bounds.height).to.be.closeTo(400 * scale * zoom, 1);
    expect(
      getComputedStyle(image.closest('[role="dialog"]')).backgroundColor
    ).to.equal('rgba(0, 0, 0, 0.95)');
  });
};

describe('Document image viewer', () => {
  beforeEach(() => {
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
  });

  it('requests originals only in the viewer and keeps the source while zooming', () => {
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

  it('keeps the white backing fitted to a transparent image on resize and zoom', () => {
    cy.intercept('/lightbox-tests/portrait.png', {
      headers: { 'content-type': 'image/svg+xml' },
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="400">
        <path d="M 20 20 L 100 100" stroke="black"/>
      </svg>`
    });
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/7' },
      {
        body: {
          id: 7,
          title: 'Image backing test',
          type: 'Article',
          files: [
            {
              fileName: 'portrait.png',
              completePath: '/lightbox-tests/portrait.png'
            }
          ],
          authors: [],
          authorsOrganization: [],
          massifs: [],
          entrances: [],
          isDeleted: false,
          isValidated: true
        }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/7/children' },
      { body: { documents: [] } }
    );
    cy.viewport(1200, 800);
    cy.visit('/documents/7', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.get('img[alt="portrait.png"]', { timeout: 30000 }).click();

    expectImageFit();
    cy.viewport(390, 844);
    expectImageFit();
    cy.viewport(844, 390);
    expectImageFit();
    cy.get('[data-testid="lightbox-image"]').trigger('wheel', { deltaY: -100 });
    expectImageFit(1.2);
    cy.get('[aria-label="Reset zoom"]').click();
    expectImageFit();
  });
});
