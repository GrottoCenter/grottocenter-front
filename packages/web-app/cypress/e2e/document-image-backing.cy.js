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

describe('Document image backing', () => {
  beforeEach(() => {
    cy.mockApiCatchAll();
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
  });

  it('keeps the white backing fitted to a transparent image on resize and zoom', () => {
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
