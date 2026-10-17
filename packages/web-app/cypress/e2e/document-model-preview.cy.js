const modelUrl = 'https://models.example.org/documents/cave-scan.glb';
const modelRequest = {
  method: 'GET',
  hostname: 'models.example.org',
  pathname: '/documents/cave-scan.glb'
};
const modelFile = {
  id: 12,
  fileName: 'cave-scan.glb',
  completePath: modelUrl,
  thumbnails: {
    small: null,
    medium: 'https://models.example.org/thumbnails/medium/cave-scan.webp',
    large: 'https://models.example.org/thumbnails/large/cave-scan.webp'
  }
};
const document = {
  id: 1,
  title: 'Cave scan',
  type: 'Topographic Data',
  isValidated: true,
  isDeleted: false,
  files: [modelFile],
  authors: [],
  authorsOrganization: [],
  massifs: [],
  entrances: []
};
const modelResponse = {
  fixture: 'model-preview.glb,null',
  headers: {
    'content-type': 'model/gltf-binary',
    'access-control-allow-origin': '*'
  }
};
const viewerSelector = '[data-testid="model-viewer"]';

const triggerPointer = (name, button, buttons, clientX, clientY) =>
  cy.get(viewerSelector).shadow().find('.userInput').trigger(name, {
    eventConstructor: 'PointerEvent',
    pointerId: 1,
    pointerType: 'mouse',
    button,
    buttons,
    clientX,
    clientY
  });

const expectCentered = (element, frame, verticalTolerance = 2) => {
  const bounds = element.getBoundingClientRect();
  const container = frame.getBoundingClientRect();
  expect(
    Math.abs(bounds.x + bounds.width / 2 - container.x - container.width / 2)
  ).to.be.lessThan(2);
  expect(
    Math.abs(bounds.y + bounds.height / 2 - container.y - container.height / 2)
  ).to.be.lessThan(verticalTolerance);
};

const visitDocument = () => {
  cy.visit('/documents/1', {
    onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
  });
  cy.contains('h1', 'Cave scan', { timeout: 60000 }).should('be.visible');
};

describe('Document 3D preview', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/1' },
      {
        body: document
      }
    );
    cy.intercept('https://models.example.org/thumbnails/**', {
      fixture: 'model-preview.svg',
      headers: { 'content-type': 'image/svg+xml' }
    }).as('thumbnail');
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      { body: { languages: [] } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/licenses' },
      { body: { licenses: [] } }
    );
  });

  [1280, 390].forEach(width => {
    it(`shows model thumbnails on an entrance at ${width}px without loading 3D`, () => {
      cy.viewport(width, 900);
      cy.intercept('**/modelViewer*.js*').as('modelRuntime');
      cy.intercept(modelRequest, modelResponse).as('modelFile');
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/entrances/42' },
        {
          body: {
            id: 42,
            name: 'Test entrance',
            isDeleted: false,
            documents: [{ ...document, type: 'Physical Object' }],
            massifs: [],
            locations: [],
            descriptions: [],
            riggings: [],
            histories: [],
            comments: []
          }
        }
      );
      cy.visit('/entrances/42?tab=documents', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
      });
      cy.get('img[alt="cave-scan.glb"]', { timeout: 30000 }).scrollIntoView();
      cy.get('img[alt="cave-scan.glb"]')
        .should('be.visible')
        .and(image => expect(image[0].naturalWidth).to.be.greaterThan(0))
        .and('have.css', 'object-fit', 'contain');
      cy.contains('a', 'cave-scan.glb')
        .should('have.attr', 'href', modelUrl)
        .find('svg')
        .should('have.css', 'color', 'rgb(135, 197, 64)');
      cy.get('@modelFile.all').should('have.length', 0);
      cy.get('@modelRuntime.all').should('have.length', 0);
      cy.get('img[alt="cave-scan.glb"]')
        .closest('a')
        .should('have.attr', 'href', '/ui/documents/1')
        .click();
      cy.contains('h1', 'Cave scan').should('be.visible');
      cy.get('[data-testid="model-preview"]').should(
        'have.attr',
        'data-status',
        'idle'
      );
      cy.get('@modelFile.all').should('have.length', 0);
      cy.get('@modelRuntime.all').should('have.length', 0);
    });
  });

  it('loads on demand and keeps mouse, zoom and reset controls working', () => {
    cy.intercept('**/modelViewer*.js*').as('modelRuntime');
    // Exercise the production API contract without depending on a live scan.
    cy.intercept(modelRequest, {
      ...modelResponse,
      delay: 500
    }).as('modelFile');
    visitDocument();
    cy.get('[data-testid="model-preview"]').should(
      'have.attr',
      'data-status',
      'idle'
    );
    cy.get(viewerSelector).should('not.exist');
    cy.get('[data-testid="model-preview-poster"]').should('be.visible');
    cy.wait('@thumbnail')
      .its('request.url')
      .should('eq', modelFile.thumbnails.large);
    cy.get('[data-testid="model-preview-background"]').should('not.exist');
    cy.get('@modelFile.all').should('have.length', 0);
    cy.get('@modelRuntime.all').should('have.length', 0);
    cy.get('[data-testid="model-preview-start"]').should(([button]) => {
      expectCentered(
        button,
        button.closest('[data-testid="model-preview-overlay"]')
      );
    });
    cy.get('[data-testid="model-preview-start"]').click();
    cy.wait('@modelRuntime');
    cy.get('[data-testid="model-preview-overlay"] [role="progressbar"]').should(
      ([spinner]) => {
        expectCentered(spinner, spinner.parentElement, 40);
      }
    );
    // The first request follows the lazy engine import, which can take longer
    // than Cypress's 5-second request timeout on a cold development server.
    cy.wait('@modelFile', { requestTimeout: 30000 });
    cy.get('[data-testid="model-preview"]', { timeout: 30000 }).should(
      'have.attr',
      'data-status',
      'ready'
    );
    cy.get(viewerSelector).should(([viewer]) => {
      expect(viewer.cameraControls).to.eq(true);
    });
    cy.get('[data-testid="model-preview-background"]')
      .should('have.attr', 'aria-label', 'Dark background')
      .click();
    cy.get('[data-testid="model-preview-frame"]')
      .should('have.attr', 'data-background', 'dark')
      .and('have.css', 'background-color', 'rgb(33, 33, 33)');
    cy.get('[data-testid="model-preview-background"]')
      .should('have.attr', 'aria-label', 'Light background')
      .click();
    cy.get('[data-testid="model-preview-frame"]')
      .should('have.attr', 'data-background', 'light')
      .and('have.css', 'background-color', 'rgb(245, 245, 245)');
    cy.get('[data-testid="model-preview-controls"]').should(([controls]) => {
      const rect = controls.getBoundingClientRect();
      const frame = controls.parentElement.getBoundingClientRect();
      expect(
        Math.abs(rect.x + rect.width / 2 - frame.x - frame.width / 2)
      ).to.be.lessThan(2);
      expect(frame.bottom - rect.bottom).to.be.within(15, 18);
    });

    cy.get(viewerSelector).then(([viewer]) => {
      cy.wrap(viewer.getCameraOrbit().radius).as('initialRadius');
    });
    cy.get('[data-testid="model-preview-zoom-in"]').click();
    cy.get('@initialRadius').then(radius => {
      cy.get(viewerSelector).should(([viewer]) => {
        expect(viewer.getCameraOrbit().radius).to.be.lessThan(radius);
      });
    });
    cy.get(viewerSelector).then(([viewer]) => {
      cy.wrap(viewer.getCameraOrbit().radius).as('zoomedRadius');
    });
    cy.get('[data-testid="model-preview-zoom-out"]').click();
    cy.get('@zoomedRadius').then(radius => {
      cy.get(viewerSelector).should(([viewer]) => {
        expect(viewer.getCameraOrbit().radius).to.be.greaterThan(radius);
      });
    });
    cy.get('[data-testid="model-preview-reset"]').click();
    cy.get(viewerSelector).should(([viewer]) => {
      expect(viewer.cameraOrbit).to.eq('0deg 75deg auto');
    });

    // Send pointer events to the actual interactive surface in the shadow DOM,
    // including after the controls have taken focus.
    triggerPointer('pointerdown', 0, 1, 200, 200);
    triggerPointer('pointermove', 0, 1, 300, 220);
    triggerPointer('pointerup', 0, 0, 300, 220);
    cy.get(viewerSelector).should(([viewer]) => {
      expect(Math.abs(viewer.getCameraOrbit().theta)).to.be.greaterThan(0.1);
    });
    cy.get(viewerSelector).then(([viewer]) => {
      cy.wrap(viewer.getCameraOrbit().radius).as('beforeWheelRadius');
    });
    cy.get(viewerSelector)
      .shadow()
      .find('.userInput')
      .trigger('wheel', { eventConstructor: 'WheelEvent', deltaY: -100 });
    cy.get('@beforeWheelRadius').then(radius => {
      cy.get(viewerSelector).should(([viewer]) => {
        expect(viewer.getCameraOrbit().radius).to.be.lessThan(radius);
      });
    });
    cy.get(viewerSelector).then(([viewer]) => {
      cy.wrap(viewer.getCameraTarget().x).as('beforePanX');
    });
    triggerPointer('pointerdown', 2, 2, 200, 200);
    triggerPointer('pointermove', 2, 2, 250, 230);
    triggerPointer('pointerup', 2, 0, 250, 230);
    cy.get('@beforePanX').then(x => {
      cy.get(viewerSelector).should(([viewer]) => {
        expect(Math.abs(viewer.getCameraTarget().x - x)).to.be.greaterThan(
          0.01
        );
      });
    });
    cy.get('[data-testid="model-preview-reset"]').click();
    cy.get('@initialRadius').then(radius => {
      cy.get(viewerSelector).should(([viewer]) => {
        expect(viewer.getCameraOrbit().theta).to.be.closeTo(0, 0.001);
        expect(viewer.getCameraOrbit().radius).to.be.closeTo(radius, 0.001);
        expect(viewer.getCameraTarget().x).to.be.closeTo(0, 0.001);
      });
    });
  });

  it('keeps download and retry available after a failed load', () => {
    cy.intercept(modelRequest, { statusCode: 404 }).as('missingModel');
    visitDocument();
    cy.get('[data-testid="model-preview-start"]').click();
    cy.wait('@missingModel', { requestTimeout: 30000 });
    cy.get('[data-testid="model-preview"]', { timeout: 30000 }).should(
      'have.attr',
      'data-status',
      'error'
    );
    cy.get('[data-testid="model-preview"]')
      .find('[role="alert"]')
      .should('be.visible');
    cy.get('[data-testid="model-preview-start"]').should('have.text', 'Retry');
    cy.contains('a', 'cave-scan.glb')
      .should('be.visible')
      .and('have.attr', 'download', 'cave-scan.glb')
      .and('have.attr', 'href')
      .and('eq', modelUrl);
    cy.intercept(modelRequest, modelResponse);
    cy.get('[data-testid="model-preview-start"]').click();
    cy.get('[data-testid="model-preview"]', { timeout: 30000 }).should(
      'have.attr',
      'data-status',
      'ready'
    );
  });

  it('lists multiple GLB files and loads each preview independently', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/1' },
      {
        body: {
          ...document,
          files: [
            {
              ...modelFile
            },
            {
              fileName: 'physical-object.GLB',
              completePath: 'https://models.example.org/documents/object.GLB',
              thumbnails: null
            }
          ]
        }
      }
    );
    cy.intercept(modelRequest, modelResponse).as('firstModel');
    visitDocument();
    cy.get('[data-testid="model-preview"]').should('have.length', 2);
    cy.contains('a', 'cave-scan.glb').should('be.visible');
    cy.contains('a', 'physical-object.GLB').should('be.visible');
    cy.get('[data-testid="model-preview-start"]').first().click();
    cy.wait('@firstModel', { requestTimeout: 30000 });
    cy.get('[data-testid="model-preview"]', { timeout: 30000 })
      .first()
      .should('have.attr', 'data-status', 'ready');
    cy.get('[data-testid="model-preview"]')
      .eq(1)
      .should('have.attr', 'data-status', 'idle');
    cy.get(viewerSelector).should('have.length', 1);
  });

  it('does not inject a model into documents with only other attachments', () => {
    const gltfUrl = 'https://models.example.org/documents/source.gltf';
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/1' },
      {
        body: {
          ...document,
          files: [
            {
              fileName: 'source.gltf',
              completePath: gltfUrl,
              thumbnails: null
            },
            {
              fileName: 'survey.th',
              completePath: 'https://models.example.org/survey.th'
            }
          ]
        }
      }
    );
    visitDocument();
    cy.contains('h1', 'Cave scan').should('be.visible');
    cy.get('[data-testid="model-preview"]').should('not.exist');
    cy.contains('a', 'source.gltf').should('have.attr', 'href', gltfUrl);
    cy.contains('a', 'survey.th').should('be.visible');
  });

  it('opens a physical-object GLB without a generated thumbnail', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/1' },
      {
        body: {
          ...document,
          type: 'Physical Object',
          files: [{ ...modelFile, thumbnails: null }]
        }
      }
    );
    cy.intercept(modelRequest, modelResponse).as('modelFile');
    visitDocument();
    cy.get('[data-testid="model-preview-poster"]').should('not.exist');
    cy.get('@modelFile.all').should('have.length', 0);
    cy.contains('a', 'cave-scan.glb').should('have.attr', 'download');
    cy.get('[data-testid="model-preview-start"]').click();
    cy.wait('@modelFile', { requestTimeout: 30000 });
    cy.get('[data-testid="model-preview"]', { timeout: 30000 }).should(
      'have.attr',
      'data-status',
      'ready'
    );
  });

  it('keeps the viewer usable when the browser rejects fullscreen', () => {
    cy.intercept(modelRequest, modelResponse).as('modelFile');
    visitDocument();
    cy.get('[data-testid="model-preview-start"]').click();
    cy.wait('@modelFile', { requestTimeout: 30000 });
    cy.get('[data-testid="model-preview"]', { timeout: 30000 }).should(
      'have.attr',
      'data-status',
      'ready'
    );
    cy.get('[data-testid="model-preview-frame"]').then(([frame]) => {
      cy.stub(frame, 'requestFullscreen')
        .rejects(new TypeError('Fullscreen request denied'))
        .as('requestFullscreen');
    });
    cy.get('[data-testid="model-preview-fullscreen"]').click();
    cy.get('@requestFullscreen').should('have.been.calledOnce');
    cy.get('[data-testid="model-preview-fullscreen"]').should('not.exist');
    cy.get('[data-testid="model-preview"]').should(
      'have.attr',
      'data-status',
      'ready'
    );
    cy.get('[data-testid="model-preview-zoom-in"]').should('be.enabled');
    cy.contains('a', 'cave-scan.glb').should('have.attr', 'download');
  });

  it('keeps icon tooltips, long press and fullscreen controls usable on mobile', () => {
    cy.viewport(390, 844);
    cy.intercept(modelRequest, modelResponse).as('modelFile');
    visitDocument();
    cy.get('[data-testid="model-preview-controls"]').should('not.exist');
    cy.get('[data-testid="model-preview-start"]').click();
    cy.wait('@modelFile', { requestTimeout: 30000 });
    cy.get('[data-testid="model-preview"]', { timeout: 30000 }).should(
      'have.attr',
      'data-status',
      'ready'
    );
    // Native fullscreen rejects synthetic clicks in CI browsers. Simulate the
    // browser API so requests, fullscreenchange events and controls stay tested.
    cy.get('[data-testid="model-preview-frame"]').then(([frame]) => {
      const doc = frame.ownerDocument;
      let fullscreenElement = null;
      const changeFullscreen = element => {
        fullscreenElement = element;
        doc.dispatchEvent(new doc.defaultView.Event('fullscreenchange'));
        return Promise.resolve();
      };
      cy.stub(doc, 'fullscreenElement').get(() => fullscreenElement);
      cy.stub(frame, 'requestFullscreen')
        .callsFake(() => changeFullscreen(frame))
        .as('requestFullscreen');
      cy.stub(doc, 'exitFullscreen')
        .callsFake(() => changeFullscreen(null))
        .as('exitFullscreen');
    });
    cy.get('[data-testid="model-preview-zoom-in"]').trigger('touchstart', {
      touches: [{ clientX: 200, clientY: 400 }],
      changedTouches: [{ clientX: 200, clientY: 400 }]
    });
    cy.contains('[role="tooltip"]', 'Zoom in').should('be.visible');
    cy.get('[data-testid="model-preview-zoom-in"]').trigger('touchend', {
      touches: [],
      changedTouches: [{ clientX: 200, clientY: 400 }]
    });
    cy.get('[data-testid="model-preview-fullscreen"]').click();
    cy.get('@requestFullscreen').should('have.been.calledOnce');
    cy.document().should(doc => {
      expect(doc.fullscreenElement, 'active fullscreen frame').to.equal(
        doc.querySelector('[data-testid="model-preview-frame"]')
      );
    });
    cy.get('[data-testid="model-preview-fullscreen"]')
      .should('have.attr', 'aria-label', 'Exit full screen')
      .click();
    cy.get('@exitFullscreen').should('have.been.calledOnce');
    cy.document().should(doc => expect(doc.fullscreenElement).to.eq(null));
    cy.get('[data-testid="model-preview-controls"]').should(([controls]) => {
      const frame = controls.parentElement.getBoundingClientRect();
      const bounds = controls.getBoundingClientRect();
      expect(bounds.left).to.be.greaterThan(frame.left);
      expect(bounds.right).to.be.lessThan(frame.right);
    });
  });
});
