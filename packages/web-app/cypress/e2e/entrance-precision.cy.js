const POSITION = { latitude: 45.125, longitude: 5.25, accuracy: 6.4 };
const ENTRANCE = {
  id: 1,
  name: 'Test entrance',
  language: 'eng',
  latitude: 45,
  longitude: 5,
  precision: 12,
  isSensitive: false,
  cave: {
    id: 2,
    name: 'Test entrance',
    language: 'eng',
    depth: 0,
    length: 0,
    temperature: 0,
    entrances: [{ id: 1 }]
  }
};

const accuracyInput = () =>
  cy.get('[data-testid="entrance-precision"]', { timeout: 20000 });
const accuracyLegend = () =>
  cy.get('[data-testid="entrance-precision-legend"]');
const inputByLabel = label =>
  cy
    .contains('label', label)
    .invoke('attr', 'for')
    .then(id => cy.get('input').filter((_index, input) => input.id === id));
const submitForm = () =>
  accuracyInput().closest('form').find('button[type="submit"]').click();
const emitLocation = () =>
  cy.get('@emitLocation').then(emit => {
    emit();
  });

const visitForm = (
  path,
  {
    isLocationDenied = false,
    positions = [POSITION],
    usePseudoFullscreen = false
  } = {}
) => {
  cy.mockApiCatchAll();
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/languages' },
    { body: [{ id: 'eng', refName: 'English' }] }
  );
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/entrances/1' },
    { body: ENTRANCE }
  );
  cy.intercept(
    { method: 'GET', pathname: '/api/v1/geoloc/entrances' },
    { body: [] }
  );
  cy.intercept(
    { method: 'POST', pathname: '/api/v1/caves' },
    { body: { id: 2 } }
  ).as('createCave');
  cy.intercept(
    { method: 'POST', pathname: '/api/v1/entrances' },
    { body: ENTRANCE }
  ).as('createEntrance');
  cy.intercept(
    { method: 'PUT', pathname: '/api/v1/entrances/1' },
    { body: ENTRANCE }
  ).as('updateEntrance');
  cy.loginAs();
  cy.visit(path, {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', 'en');
      if (usePseudoFullscreen) {
        // Cypress clicks do not grant the activation required by native
        // fullscreen in Firefox. Exercise Leaflet's supported fallback.
        Object.defineProperty(win.document, 'fullscreenEnabled', {
          configurable: true,
          value: false
        });
      }
      let requestCount = 0;
      const watches = new Map();
      // Drive fixes from Cypress commands so restoring a fake clock or a
      // delayed browser timer cannot change which measurement a test receives.
      cy.stub()
        .callsFake(() => {
          const watch = Array.from(watches.values()).at(-1);
          expect(watch, 'active GPS watch').to.be.an('object');
          const coords = watch.fixes[watch.nextFix];
          expect(coords, 'queued GPS fix').to.be.an('object');
          watch.nextFix += 1;
          if (isLocationDenied) watch.error({ code: 1 });
          else watch.success({ coords, timestamp: win.Date.now() });
        })
        .as('emitLocation');
      Object.defineProperty(win.navigator, 'geolocation', {
        configurable: true,
        value: {
          watchPosition: (success, error) => {
            const watchId = requestCount;
            const position =
              positions[Math.min(requestCount, positions.length - 1)];
            requestCount += 1;
            const fixes = Array.isArray(position) ? position : [position];
            watches.set(watchId, { success, error, fixes, nextFix: 0 });
            return watchId;
          },
          clearWatch: watchId => {
            watches.delete(watchId);
          }
        }
      });
      cy.spy(win.navigator.geolocation, 'watchPosition').as('watchPosition');
      cy.spy(win.navigator.geolocation, 'clearWatch').as('clearWatch');
    }
  });
  accuracyInput().should('be.visible');
};

describe('Entrance accuracy', () => {
  it('shows an accuracy legend with an orange symbol and removes it when cleared', () => {
    visitForm('/entrances/1/edit');
    accuracyLegend().should('have.text', 'Accuracy');
    accuracyInput().clear().type('250');
    accuracyLegend()
      .should('have.text', 'Accuracy')
      .and('not.have.css', 'color', 'rgb(245, 124, 0)');
    accuracyLegend()
      .find('span')
      .should('have.css', 'border-top-color', 'rgb(245, 124, 0)');
    accuracyLegend().scrollIntoView({ offset: { top: -200, left: 0 } });
    accuracyInput().clear();
    accuracyLegend().should('not.exist');
  });

  it('refreshes position and accuracy using fresh high accuracy fixes', () => {
    const movedPosition = {
      latitude: 45.13,
      longitude: 5.26,
      accuracy: 8.2
    };
    visitForm('/entrances/1/edit', {
      positions: [POSITION, movedPosition, { ...movedPosition, accuracy: 4.1 }]
    });
    cy.get('@watchPosition').should('not.have.been.called');
    cy.get('[data-testid="locate-me"]').click();
    emitLocation();
    accuracyInput().should('have.value', '7');
    accuracyLegend().should('have.text', 'Accuracy');
    inputByLabel('Latitude').should('have.value', '45.125000');
    inputByLabel('Longitude').should('have.value', '5.250000');
    cy.get('[data-testid="locate-me"]').click();
    emitLocation();
    accuracyInput().should('have.value', '9');
    accuracyLegend().should('have.text', 'Accuracy');
    inputByLabel('Latitude').should('have.value', '45.130000');
    inputByLabel('Longitude').should('have.value', '5.260000');
    accuracyInput().clear().type('250');
    cy.get('[data-testid="locate-me"]').click();
    emitLocation();
    accuracyInput().should('have.value', '5');
    accuracyLegend().should('have.text', 'Accuracy');
    inputByLabel('Latitude').should('have.value', '45.130000');
    inputByLabel('Longitude').should('have.value', '5.260000');
    cy.get('@watchPosition').should('have.been.calledThrice');
    cy.get('@watchPosition').then(watchPosition => {
      watchPosition.getCalls().forEach(call => {
        expect(call.args[2]).to.deep.equal({
          enableHighAccuracy: true,
          timeout: 60000,
          maximumAge: 0
        });
      });
    });
  });

  it('improves a coarse first fix and releases GPS once precise enough', () => {
    visitForm('/entrances/1/edit', {
      positions: [
        [
          { latitude: 45.1, longitude: 5.1, accuracy: 100 },
          { latitude: 45.2, longitude: 5.2, accuracy: 25 },
          { latitude: 45.3, longitude: 5.3, accuracy: 80 },
          POSITION
        ]
      ]
    });
    cy.clock();
    cy.get('[data-testid="locate-me"]').click();
    emitLocation();
    cy.tick(100);
    accuracyInput().should('have.value', '100');
    cy.get('[data-testid="locate-me"]').should(
      'have.attr',
      'aria-label',
      'Stop searching'
    );
    cy.get('[data-testid="location-status"]').should('contain.text', '±100 m');
    cy.tick(500);
    emitLocation();
    accuracyInput().should('have.value', '25');
    cy.tick(500);
    emitLocation();
    accuracyInput().should('have.value', '25');
    cy.tick(500);
    emitLocation();
    accuracyInput().should('have.value', '7');
    inputByLabel('Latitude').should('have.value', '45.125000');
    inputByLabel('Longitude').should('have.value', '5.250000');
    cy.get('[data-testid="locate-me"]').should('not.be.disabled');
    cy.get('@clearWatch').should('have.been.calledOnce');
  });

  it('gives manual coordinate edits priority over GPS updates', () => {
    visitForm('/entrances/1/edit', {
      positions: [[{ ...POSITION, accuracy: 100 }, POSITION]]
    });
    cy.clock();
    cy.get('[data-testid="locate-me"]').click();
    emitLocation();
    cy.tick(100);
    accuracyInput().should('have.value', '100');
    inputByLabel('Latitude').clear().type('45.9');
    cy.get('@clearWatch').should('have.been.calledOnce');
    cy.get('@watchPosition').then(watchPosition => {
      // A fix already queued by the browser can arrive even after clearWatch.
      watchPosition.firstCall.args[0]({
        coords: POSITION,
        timestamp: Date.now()
      });
    });
    inputByLabel('Latitude').should('have.value', '45.9');
    accuracyInput().should('have.value', '');
    cy.get('[data-testid="locate-me"]').should('not.be.disabled');
  });

  it('prefills device accuracy and saves a manual correction at creation', () => {
    visitForm('/entity/add/entrance');
    accuracyInput().should('have.value', '');
    inputByLabel('Entrance name').type('Test entrance');
    cy.get('[data-testid="locate-me"]').click();
    emitLocation();
    accuracyInput().should('have.value', '7').clear().type('250');
    inputByLabel('Latitude').clear().type('45.2');
    accuracyInput().should('have.value', '250');
    submitForm();
    cy.wait('@createEntrance').its('request.body').should('include', {
      precision: 250,
      latitude: '45.2',
      longitude: '5.250000'
    });
  });

  it('saves an accuracy-only edit without changing coordinates', () => {
    visitForm('/entrances/1/edit');
    accuracyInput().should('have.value', '12').clear().type('8');
    submitForm();
    cy.wait('@updateEntrance').its('request.body').should('include', {
      precision: 8,
      latitude: 45,
      longitude: 5
    });
  });

  it('allows clearing a previously recorded accuracy', () => {
    visitForm('/entrances/1/edit');
    accuracyInput().clear();
    submitForm();
    cy.wait('@updateEntrance').its('request.body.precision').should('be.null');
  });

  it('preserves existing values when location access is denied', () => {
    visitForm('/entrances/1/edit', { isLocationDenied: true });
    cy.get('[data-testid="locate-me"]').click();
    emitLocation();
    accuracyInput().should('have.value', '12');
    inputByLabel('Latitude').should('have.value', '45');
    inputByLabel('Longitude').should('have.value', '5');
  });

  it('groups the coordinate system and accuracy beside coordinates on mobile', () => {
    cy.viewport(375, 812);
    visitForm('/entrances/1/edit');
    accuracyInput().clear().type('250');
    inputByLabel('Latitude').then(latitude => {
      const latitudeBox = latitude[0].parentElement.getBoundingClientRect();
      cy.get('[data-testid="coordinate-system-selector"]').then(selector => {
        const buttonBox = selector[0].getBoundingClientRect();
        expect(buttonBox.top).to.be.closeTo(latitudeBox.top, 1);
        expect(buttonBox.bottom).to.be.closeTo(latitudeBox.bottom, 1);
      });
      inputByLabel('Longitude').then(longitude => {
        expect(longitude[0].getBoundingClientRect().left).to.be.closeTo(
          latitude[0].getBoundingClientRect().left,
          1
        );
        expect(longitude[0].getBoundingClientRect().top).to.be.greaterThan(
          latitude[0].getBoundingClientRect().bottom
        );
        accuracyInput().then(accuracy => {
          const longitudeBox =
            longitude[0].parentElement.getBoundingClientRect();
          const accuracyBox = accuracy[0].parentElement.getBoundingClientRect();
          expect(accuracyBox.top).to.be.closeTo(longitudeBox.top, 1);
          expect(accuracyBox.bottom).to.be.closeTo(longitudeBox.bottom, 1);
        });
      });
      accuracyInput().then(accuracy => {
        expect(accuracy[0].getBoundingClientRect().right).to.be.lessThan(
          latitude[0].getBoundingClientRect().left
        );
        expect(accuracy[0].getBoundingClientRect().top).to.be.greaterThan(
          latitude[0].getBoundingClientRect().bottom
        );
      });
    });
  });

  it('can stop searching and retain the measurement without applying queued fixes', () => {
    cy.viewport(375, 812);
    visitForm('/entrances/1/edit', {
      positions: [[{ ...POSITION, accuracy: 100 }, POSITION]]
    });
    cy.clock();
    cy.get('[data-testid="locate-me"]').click();
    emitLocation();
    cy.tick(100);
    accuracyInput().should('have.value', '100');
    cy.get('button[aria-label="Stop searching"]').should('have.length', 1);
    cy.get('[data-testid="location-status"]').then(status => {
      const mapElement = status[0].previousElementSibling;
      const mapBox = mapElement.getBoundingClientRect();
      const statusBox = status[0].getBoundingClientRect();
      expect(statusBox.top).to.be.at.least(mapBox.bottom);
      cy.get('[data-testid="locate-me"]').then(button => {
        expect(mapElement.contains(button[0])).to.equal(true);
      });
    });
    cy.get('[data-testid="locate-me"]').click();
    cy.tick(500);
    cy.get('@watchPosition').then(watchPosition => {
      // Even a callback already queued by the browser must be ignored.
      watchPosition.firstCall.args[0]({
        coords: POSITION,
        timestamp: Date.now()
      });
    });
    accuracyInput().should('have.value', '100');
    cy.get('[data-testid="location-status"]').should(
      'contain.text',
      'Estimated device accuracy'
    );
    cy.get('@clearWatch').should('have.been.calledOnce');
  });

  it('preserves the best estimate at the deadline and offers retry', () => {
    visitForm('/entrances/1/edit', {
      positions: [{ ...POSITION, accuracy: 100 }]
    });
    cy.clock();
    cy.get('[data-testid="locate-me"]').click();
    emitLocation();
    accuracyInput().should('have.value', '100');
    cy.tick(60000);
    accuracyInput().should('have.value', '100');
    cy.get('[data-testid="location-status"]').should(
      'contain.text',
      'Best accuracy received'
    );
    cy.get('[data-testid="locate-me"]')
      .should('have.attr', 'aria-label', 'Try again')
      .click();
    cy.get('@watchPosition').should('have.been.calledTwice');
  });

  it('keeps GPS and its status working when entering and leaving fullscreen', () => {
    cy.viewport(375, 812);
    visitForm('/entrances/1/edit', {
      positions: [{ ...POSITION, accuracy: 100 }],
      usePseudoFullscreen: true
    });
    cy.clock();
    cy.get('[data-testid="locate-me"]').click();
    emitLocation();
    cy.tick(100);
    accuracyInput().should('have.value', '100');
    cy.get('[data-testid="location-status"]')
      .prev()
      .as('selectorMap', { type: 'static' });
    cy.tick(1000);
    cy.get('[role="button"][aria-label="Full Screen"]').click();
    cy.get('[role="button"][aria-label="Exit Full Screen"]').should(
      'be.visible'
    );
    cy.get('@selectorMap')
      .find('[data-testid="location-status"]')
      // This overlay lets pointer events reach the map. Cypress's fixed-element
      // visibility check treats the canvas returned by hit-testing as cover.
      .should('have.css', 'visibility', 'visible')
      .and('contain.text', '±100 m')
      .then(status => {
        cy.get('@selectorMap').then(map => {
          const mapBox = map[0].getBoundingClientRect();
          const statusBox = status[0].getBoundingClientRect();
          expect(statusBox.height).to.be.greaterThan(0);
          expect(statusBox.top).to.be.at.least(mapBox.top);
          expect(statusBox.bottom).to.be.at.most(mapBox.bottom);
          expect(statusBox.left).to.be.at.least(mapBox.left);
          expect(statusBox.right).to.be.at.most(mapBox.right);
        });
      });
    cy.get('button[aria-label="Stop searching"]').should('have.length', 1);
    cy.get('@clearWatch').should('not.have.been.called');
    accuracyLegend()
      .invoke('text')
      .then(text => {
        cy.get('[data-testid="location-status"]')
          .invoke('text')
          .should('eq', text);
      });
    cy.get('@watchPosition').then(watchPosition => {
      watchPosition.firstCall.args[0]({
        coords: { ...POSITION, accuracy: 25 },
        timestamp: Date.now()
      });
    });
    cy.get('[data-testid="location-status"]').should('contain.text', '±25 m');
    cy.tick(1000);
    cy.get('[role="button"][aria-label="Exit Full Screen"]').click();
    cy.get('[role="button"][aria-label="Full Screen"]').should('be.visible');
    cy.get('@selectorMap')
      .find('[data-testid="location-status"]')
      .should('not.exist');
    cy.get('[data-testid="location-status"]').should('be.visible');
    cy.get('@clearWatch').should('not.have.been.called');
    cy.get('@watchPosition').then(watchPosition => {
      watchPosition.firstCall.args[0]({
        coords: POSITION,
        timestamp: Date.now()
      });
    });
    accuracyInput().should('have.value', '7');
    inputByLabel('Latitude').should('have.value', '45.125000');
    cy.get('@clearWatch').should('have.been.calledOnce');
  });

  it('invalidates a device estimate when coordinates are edited after acquisition', () => {
    visitForm('/entrances/1/edit');
    cy.get('[data-testid="locate-me"]').click();
    emitLocation();
    accuracyInput().should('have.value', '7');
    inputByLabel('Latitude').clear().type('45.9');
    accuracyInput().should('have.value', '');
    accuracyLegend().should('not.exist');
    cy.get('[data-testid="location-status"]').should(
      'contain.text',
      'Position changed'
    );
  });

  it('rejects malformed accuracy without silently clearing the stored value', () => {
    visitForm('/entrances/1/edit');
    accuracyInput().clear().focus();
    // Cypress .type() sanitizes incomplete number input. Simulate the native
    // validity flag without the Chromium-only debugger protocol.
    accuracyInput().then(input => {
      cy.stub(input[0].validity, 'badInput').get(() => true);
    });
    accuracyInput().should(input => {
      expect(input[0].validity.badInput).to.equal(true);
    });
    submitForm();
    cy.contains('Enter a whole number.').should('be.visible');
    cy.get('@updateEntrance.all').should('have.length', 0);
    accuracyInput().then(input => {
      const { validity } = input[0];
      delete validity.badInput;
    });
    cy.get('[data-testid="locate-me"]').click();
    emitLocation();
    accuracyInput()
      .should('have.value', '7')
      .and('have.attr', 'aria-invalid', 'false');
    submitForm();
    cy.wait('@updateEntrance').its('request.body.precision').should('eq', 7);
  });
});
