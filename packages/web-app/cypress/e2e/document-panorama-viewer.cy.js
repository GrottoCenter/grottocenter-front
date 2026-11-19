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
              isPanorama: true,
              thumbnails: { small: '/panorama-tests/preview.jpg' },
              description:
                'A panoramic view of the cave, with a longer caption that wraps over several lines on a narrow screen.'
            },
            {
              fileName: 'flat.jpg',
              completePath: '/panorama-tests/flat.jpg',
              thumbnails: { small: '/panorama-tests/preview.jpg' }
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
    }).as('panoramaOriginal');
    cy.intercept('/panorama-tests/preview.jpg', {
      fixture: 'panorama-preview.jpg,null',
      headers: { 'content-type': 'image/jpeg' }
    });
    cy.intercept('/panorama-tests/flat.jpg', {
      fixture: 'panorama-preview.jpg,null',
      headers: { 'content-type': 'image/jpeg' }
    });
  });

  [1280, 390].forEach(width => {
    ['close', 'navigate'].forEach(action => {
      // Keep the intercepted request pending through the screenshot and action.
      it(
        `keeps ${action} usable while the original is pending at ${width}px`,
        { defaultCommandTimeout: 15000 },
        () => {
          let releaseOriginal;
          cy.intercept(
            source,
            request =>
              new Promise(resolve => {
                releaseOriginal = () => {
                  request.reply({
                    fixture: 'panorama-preview.jpg,null',
                    headers: { 'content-type': 'image/jpeg' }
                  });
                  resolve();
                };
              })
          );
          cy.viewport(width, 844);
          cy.visit('/documents/7', {
            onBeforeLoad: win =>
              win.localStorage.setItem('selectedLanguage', 'en')
          });
          cy.get('img[alt="sphere.jpg"]', { timeout: 30000 }).click();
          cy.wrap(null).should(() =>
            expect(releaseOriginal).to.be.a('function')
          );
          cy.get('[data-testid="panorama-preview"]').should(
            'have.attr',
            'data-status',
            'loading'
          );
          cy.get('[data-testid="panorama-preview"] [role="progressbar"]')
            .should('be.visible')
            .and('not.have.attr', 'aria-valuenow');
          if (action === 'close') {
            cy.screenshot(`panorama-loading-${width}px`, {
              capture: 'viewport'
            });
          }
          cy.get('[aria-label="Hide image caption"]').click();
          cy.get('[aria-label="Show image caption"]').should('be.visible');
          if (action === 'close') {
            cy.get('[aria-label="Close"]').click();
            cy.get('[role="dialog"][aria-label="sphere.jpg"]').should(
              'not.exist'
            );
          } else {
            cy.get('[aria-label="Next image"]').click();
            cy.get('[data-testid="lightbox-image"]').should(
              'have.attr',
              'src',
              '/panorama-tests/flat.jpg'
            );
          }
          cy.get('[data-testid="panorama-preview"]').should('not.exist');
          cy.then(() => releaseOriginal());
          cy.get('[data-testid="panorama-preview"]').should('not.exist');
        }
      );
    });
  });

  [1280, 390, 320].forEach(width => {
    it(`automatically opens panoramas and preserves the gallery at ${width}px`, () => {
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
      cy.get('[data-testid="panorama-preview"]').should('not.exist');
      cy.get('img[alt="sphere.jpg"]', { timeout: 30000 }).should('be.visible');
      cy.get('[data-testid="panorama-thumbnail-badge"]')
        .should('have.length', 1)
        .and('be.visible')
        .and('contain', '360°');
      cy.screenshot(`panorama-thumbnail-${width}px`, { capture: 'viewport' });
      cy.get('@panoramaOriginal.all').should('have.length', 0);
      cy.get('img[alt="sphere.jpg"]').click();
      cy.wait('@panoramaOriginal', { requestTimeout: 30000 });
      cy.get('[data-testid="panorama-mode-controls"]').should('not.exist');
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
      cy.get('[data-testid="panorama-preview"] canvas').then(([canvas]) => {
        const before = canvas.toDataURL();
        // Pannellum owns the gesture surface inside our accessible region.
        const region = canvas
          .closest('[role="region"]')
          .querySelector('.pnlm-dragfix');
        if (width >= 600) {
          cy.wrap(region).trigger('mousedown', {
            clientX: 400,
            clientY: 250,
            button: 0
          });
          cy.wrap(region).trigger('mousemove', {
            clientX: 550,
            clientY: 280,
            buttons: 1
          });
          cy.wrap(region).trigger('mouseup', { clientX: 550, clientY: 280 });
        } else {
          cy.wrap(region).trigger('touchstart', {
            targetTouches: [{ clientX: 100, clientY: 200 }],
            touches: [{ clientX: 100, clientY: 200 }]
          });
          cy.wrap(region).trigger('touchmove', {
            targetTouches: [{ clientX: 220, clientY: 230 }],
            touches: [{ clientX: 220, clientY: 230 }]
          });
          cy.wrap(region).trigger('touchend', {
            targetTouches: [],
            touches: []
          });
        }
        cy.get('[data-testid="panorama-preview"] canvas').should(
          ([currentCanvas]) =>
            expect(currentCanvas.toDataURL()).not.to.equal(before)
        );
      });
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
      cy.get('[aria-label="Next image"]').click();
      cy.get('[data-testid="panorama-preview"]').should('not.exist');
      cy.get('[data-testid="lightbox-image"]').should('be.visible');
      cy.get('[aria-label="Previous image"]').click();
      cy.get('[data-testid="panorama-preview"]').should(
        'have.attr',
        'data-status',
        'ready'
      );
      cy.get('[aria-label="Close"]').click();
      cy.get('[data-testid="panorama-mode-controls"]').should('not.exist');
      cy.get('[data-testid="lightbox-image"]').should('not.exist');
    });
  });
});
