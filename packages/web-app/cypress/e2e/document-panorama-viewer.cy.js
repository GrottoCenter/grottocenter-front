const source = '/panorama-tests/sphere.jpg';

describe('Document panorama viewer', () => {
  beforeEach(() => {
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
      { method: 'GET', pathname: '/api/v1/documents/7' },
      {
        body: {
          id: 7,
          title: 'Panorama test',
          type: 'Image',
          isValidated: true,
          files: [
            {
              fileName: 'sphere.jpg',
              completePath: source,
              description:
                'A panoramic view of the cave, with a longer caption that wraps over several lines on a narrow screen.'
            }
          ],
          authors: [],
          authorsOrganization: [],
          massifs: [],
          entrances: []
        }
      }
    );
    cy.intercept(source, {
      fixture: 'panorama-preview.jpg,null',
      headers: { 'content-type': 'image/jpeg' }
    });
  });

  [1280, 390, 320].forEach(width => {
    it(`switches between flat and spherical views at ${width}px`, () => {
      cy.viewport(width, 844);
      cy.visit('/documents/7', {
        onBeforeLoad: win => {
          win.localStorage.setItem('selectedLanguage', 'en');
          // Preserve WebGL pixels for readPixels and Cypress screenshots after
          // the viewer stops animating. The production renderer keeps its default.
          const canvasPrototype = win.HTMLCanvasElement.prototype;
          canvasPrototype.getContext = new Proxy(canvasPrototype.getContext, {
            apply: (target, canvas, [type, options]) =>
              Reflect.apply(target, canvas, [
                type,
                type.includes('webgl')
                  ? { ...options, preserveDrawingBuffer: true }
                  : options
              ])
          });
        }
      });
      cy.get('img[alt="sphere.jpg"]', { timeout: 30000 }).click();
      cy.get('[data-testid="panorama-preview"]').should('not.exist');
      cy.get('[data-testid="panorama-mode-spherical"]').click();
      cy.get('[data-testid="panorama-preview"]', { timeout: 30000 })
        .should('have.attr', 'data-status', 'ready')
        .find('canvas')
        .should('be.visible')
        .and(([canvas]) => {
          expect(canvas.width).to.be.greaterThan(100);
          expect(canvas.height).to.be.greaterThan(100);
          const gl = canvas.getContext('experimental-webgl');
          const pixel = new Uint8Array(4);
          gl.readPixels(
            Math.floor(canvas.width / 2),
            Math.floor(canvas.height / 2),
            1,
            1,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixel
          );
          expect(pixel[0] + pixel[1] + pixel[2]).to.be.greaterThan(0);
        });
      cy.get('[data-testid="lightbox-image"]').should('not.exist');
      cy.get('[aria-label="Zoom in"]').click();
      cy.get('[aria-label="Reset"]').click();
      cy.get('[data-testid="panorama-preview-controls"]').should(
        ([controls]) => {
          const caption = controls.ownerDocument.querySelector(
            '[data-testid="lightbox-caption"]'
          );
          expect(controls.getBoundingClientRect().bottom).to.be.lessThan(
            caption.getBoundingClientRect().top
          );
        }
      );
      cy.screenshot(`panorama-${width}px`, {
        capture: 'viewport',
        disableTimersAndAnimations: false
      });
      cy.get('[data-testid="panorama-mode-flat"]').click();
      cy.get('[data-testid="panorama-preview"]').should('not.exist');
      cy.get('[data-testid="lightbox-image"]').should('be.visible');
      cy.get('[aria-label="Close"]').click();
      cy.get('[data-testid="panorama-mode-controls"]').should('not.exist');
      cy.get('[data-testid="lightbox-image"]').should('not.exist');
    });
  });
});
