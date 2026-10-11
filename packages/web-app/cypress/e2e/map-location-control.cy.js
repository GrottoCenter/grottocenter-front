// End-to-end checks for the unified location control on the main map: the mode
// machine (off → follow → compass), the user-location dot, permission handling,
// the heading-up rotation and the north-reset affordance.
//
// Cypress's onBeforeLoad(win) exists specifically to attach test doubles onto
// the page's window before the app boots — mutating `win` here is the intended
// use of the parameter, not an accidental side effect. The double-underscore
// names namespace the test-only globals so they can't collide with anything
// the app itself defines.
/* eslint-disable no-underscore-dangle, no-param-reassign */

const USER = { latitude: 45.111, longitude: 5.5244, accuracy: 15 };

// Stub navigator.geolocation before the app boots so the control's watch gets a
// deterministic position, and expose a setter to simulate the user moving.
const stubGeolocation = (win, permission) => {
  // The app checks Permissions API state before starting a watch. Stubbing
  // coordinates alone still lets the headless browser deny that activation
  // or auto-start tracking before the first tap.
  const permissionStatus = Object.assign(new win.EventTarget(), {
    state: permission
  });
  const queryPermission = win.navigator.permissions.query.bind(
    win.navigator.permissions
  );
  cy.stub(win.navigator.permissions, 'query')
    .callsFake(descriptor =>
      descriptor.name === 'geolocation'
        ? win.Promise.resolve(permissionStatus)
        : queryPermission(descriptor)
    )
    .as('queryPermission');
  const listeners = new Set();
  const makePosition = ({ latitude, longitude, accuracy }) => ({
    coords: { latitude, longitude, accuracy, heading: null, speed: null },
    timestamp: Date.now()
  });

  win.__emitPosition = coords => {
    listeners.forEach(cb => cb(makePosition(coords)));
  };

  Object.defineProperty(win.navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: success => success(makePosition(USER)),
      watchPosition: success => {
        listeners.add(success);
        // Deliver an initial fix asynchronously, like a real device.
        win.setTimeout(() => {
          permissionStatus.state = 'granted';
          permissionStatus.dispatchEvent(new win.Event('change'));
          success(makePosition(USER));
        }, 30);
        return 1;
      },
      clearWatch: () => listeners.clear()
    }
  });
  cy.spy(win.navigator.geolocation, 'watchPosition').as('watchPosition');
};

// The control only offers compass mode on a device that exposes a working
// orientation sensor. Fake absolute deviceorientation events so the heading-up
// branch is reachable in a desktop-headless browser.
const stubOrientation = win => {
  let currentHeading = 0;
  const emitHeading = () => {
    // computeHeading uses `360 - alpha` for absolute events.
    const event = new win.Event('deviceorientationabsolute');
    event.absolute = true;
    event.alpha = (360 - currentHeading) % 360;
    win.dispatchEvent(event);
  };
  win.__setHeading = heading => {
    currentHeading = heading;
    emitHeading();
  };
  // A working sensor delivers continuously, including while Cypress waits
  // for a position. One late event can lose the hook's no-data timeout race.
  win.setInterval(emitHeading, 150);
  // useDeviceOrientation gates on a coarse pointer / touch capability.
  Object.defineProperty(win.navigator, 'maxTouchPoints', {
    configurable: true,
    value: 5
  });
};

const visitMap = ({ permission = 'prompt' } = {}) => {
  // The map triggers bulk-coordinate fetches on every pan/zoom. The suite
  // under test is the location/orientation control, not the map data — mock
  // the API out so CI doesn't hit the production bulk-coordinate endpoint
  // repeatedly per run (see issue #1554).
  cy.mockApiCatchAll();
  cy.visit('/map', {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', 'en');
      stubGeolocation(win, permission);
      stubOrientation(win);
    }
  });
  cy.get('[data-testid="map-location-control"]', { timeout: 20000 }).should(
    'be.visible'
  );
  cy.get('@queryPermission').should('have.been.calledWith', {
    name: 'geolocation'
  });
};

const locationButton = () => cy.get('[data-testid="map-location-control"]');
const userDot = () => cy.get('[data-testid="user-location-dot"]');
const northReset = () => cy.get('[data-testid="map-north-reset"]');

describe('Map location control', () => {
  it('renders the map with the location control and no user dot initially', () => {
    visitMap();
    locationButton().should('have.attr', 'aria-label', 'Use my location');
    cy.get('@watchPosition').should('not.have.been.called');
    userDot().should('not.exist');
    northReset().should('not.exist');
  });

  it('tracks the user and recentres the map as their position changes', () => {
    visitMap();
    locationButton().click();

    // The blue dot marker is added to the map once a fix arrives.
    cy.get('@watchPosition').should('have.been.calledOnce');
    userDot().should('be.visible');
    // The map recentres on the stubbed position.
    cy.window().then(win => {
      win.__emitPosition({ ...USER, latitude: 45.112, longitude: 5.525 });
    });
    cy.location('pathname').should(pathname => {
      const [latitude, longitude] = decodeURIComponent(pathname)
        .split('/')
        .at(-1)
        .split(',')
        .map(Number);
      // Leaflet rounds projected coordinates to viewport pixels, so the URL's
      // map centre can differ slightly from the device's exact coordinates.
      expect(latitude).to.be.closeTo(45.112, 0.0002);
      expect(longitude).to.be.closeTo(5.525, 0.0002);
    });
    userDot().should('be.visible');
  });

  it('rotates the map heading-up in compass mode and offers a north reset', () => {
    visitMap();
    // 1st tap: follow. Wait for the fix so the next tap sees a live position.
    locationButton().click();
    userDot().should('be.visible');

    // Feed a heading so the orientation hook reports a working compass.
    cy.window().then(win => win.__setHeading(90));
    locationButton().should('have.attr', 'aria-label', 'Compass mode');

    // 2nd tap: compass (heading-up).
    locationButton().click();
    cy.window().then(win => win.__setHeading(90));

    // The north-reset control appears once compass mode has rotated the map —
    // the observable side-effect of entering that mode, and the affordance
    // that lets the user return to north-up.
    northReset()
      .should('be.visible')
      .find('svg')
      .should($needle => {
        expect($needle[0].style.transform).to.equal('rotate(-90deg)');
      });
    northReset().click();
    northReset().should('not.exist');
    locationButton().should('have.attr', 'aria-label', 'Compass mode');
    userDot().should('be.visible');
  });

  it('auto-starts tracking when location permission is already granted', () => {
    visitMap({ permission: 'granted' });
    cy.get('@watchPosition').should('have.been.calledOnce');
    userDot().should('be.visible');
    locationButton().should(
      'have.attr',
      'aria-label',
      'Recenter on your location'
    );
    northReset().should('not.exist');
  });

  it('does not start a watch when location permission is denied', () => {
    visitMap({ permission: 'denied' });
    locationButton().click();
    cy.contains('Location access denied. Enable it in your browser settings.');
    cy.get('@watchPosition').should('not.have.been.called');
    userDot().should('not.exist');
  });
});
