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

const visitForm = (
  path,
  { isLocationDenied = false, positions = [POSITION] } = {}
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
      let requestCount = 0;
      Object.defineProperty(win.navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (success, error) => {
            if (isLocationDenied) error({ code: 1 });
            else {
              const coords =
                positions[Math.min(requestCount, positions.length - 1)];
              requestCount += 1;
              win.setTimeout(
                () => success({ coords, timestamp: Date.now() }),
                100
              );
            }
          }
        }
      });
      cy.spy(win.navigator.geolocation, 'getCurrentPosition').as('getPosition');
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
    cy.screenshot('entrance-precision-circle', { capture: 'viewport' });
    accuracyInput().clear();
    accuracyLegend().should('not.exist');
  });

  it('refreshes position and accuracy with a cache limited to 500 ms', () => {
    const movedPosition = {
      latitude: 45.13,
      longitude: 5.26,
      accuracy: 11.2
    };
    visitForm('/entrances/1/edit', {
      positions: [POSITION, movedPosition, { ...movedPosition, accuracy: 4.1 }]
    });
    cy.get('@getPosition').should('not.have.been.called');
    cy.get('[data-testid="locate-me"]').click();
    accuracyInput().should('have.value', '7');
    accuracyLegend().should('have.text', 'Accuracy');
    inputByLabel('Latitude').should('have.value', '45.125000');
    inputByLabel('Longitude').should('have.value', '5.250000');
    cy.get('[data-testid="locate-me"]').click();
    accuracyInput().should('have.value', '12');
    accuracyLegend().should('have.text', 'Accuracy');
    inputByLabel('Latitude').should('have.value', '45.130000');
    inputByLabel('Longitude').should('have.value', '5.260000');
    accuracyInput().clear().type('250');
    cy.get('[data-testid="locate-me"]').click();
    accuracyInput().should('have.value', '5');
    accuracyLegend().should('have.text', 'Accuracy');
    inputByLabel('Latitude').should('have.value', '45.130000');
    inputByLabel('Longitude').should('have.value', '5.260000');
    cy.get('@getPosition').should('have.been.calledThrice');
    cy.get('@getPosition').then(getPosition => {
      getPosition.getCalls().forEach(call => {
        expect(call.args[2]).to.deep.equal({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 500
        });
      });
    });
  });

  it('prefills device accuracy and saves a manual correction at creation', () => {
    visitForm('/entity/add/entrance');
    accuracyInput().should('have.value', '');
    inputByLabel('Entrance name').type('Test entrance');
    cy.get('[data-testid="locate-me"]').click();
    cy.screenshot('entrance-precision-desktop', { capture: 'viewport' });
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
        expect(longitude[0].getBoundingClientRect().left).to.equal(
          latitude[0].getBoundingClientRect().left
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
    cy.screenshot('entrance-precision-mobile', { capture: 'viewport' });
  });
});
