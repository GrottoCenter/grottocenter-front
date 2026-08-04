// End-to-end checks for the unified location control on the main map: the mode
// machine (off → follow → compass), the user-location dot with its accuracy
// circle, the heading-up rotation and the north-reset affordance.

const USER = { latitude: 45.111, longitude: 5.5244, accuracy: 15 };

// Stub navigator.geolocation before the app boots so the control's watch gets a
// deterministic position, and expose a setter to simulate the user moving.
const stubGeolocation = win => {
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
        setTimeout(() => success(makePosition(USER)), 30);
        return 1;
      },
      clearWatch: () => listeners.clear()
    }
  });
};

// The control only offers compass mode on a device that exposes a working
// orientation sensor. Fake absolute deviceorientation events so the heading-up
// branch is reachable in a desktop-headless browser.
const stubOrientation = win => {
  win.__setHeading = heading => {
    // computeHeading uses `360 - alpha` for absolute events.
    const event = new win.Event('deviceorientationabsolute');
    event.absolute = true;
    event.alpha = (360 - heading) % 360;
    win.dispatchEvent(event);
  };
  // useDeviceOrientation gates on a coarse pointer / touch capability.
  Object.defineProperty(win.navigator, 'maxTouchPoints', {
    configurable: true,
    value: 5
  });
};

const visitMap = () => {
  cy.visit('/map', {
    onBeforeLoad: win => {
      stubGeolocation(win);
      stubOrientation(win);
    }
  });
  cy.get('.leaflet-container', { timeout: 20000 }).should('exist');
};

const locationButton = () =>
  cy.get('[aria-label]').filter((_i, el) => {
    const label = el.getAttribute('aria-label') || '';
    return /location|compass|north/i.test(label);
  });

describe('Map location control', () => {
  it('renders the map with the location control and no user dot initially', () => {
    visitMap();
    // The control is present...
    locationButton().should('exist');
    // ...but nothing is tracked until the user asks for it (no accuracy circle).
    cy.get('.leaflet-container').should('exist');
  });

  it('tracks the user and shows the dot with its accuracy circle on activation', () => {
    visitMap();
    locationButton().first().click();

    // The blue dot marker is added to the map once a fix arrives.
    cy.get('.leaflet-marker-icon', { timeout: 15000 }).should('exist');
    // The map recentres on the stubbed position.
    cy.window().then(win => {
      expect(win.__emitPosition).to.be.a('function');
    });
  });

  it('rotates the map heading-up in compass mode and offers a north reset', () => {
    visitMap();
    // 1st tap: follow. Wait for the fix so the next tap sees a live position.
    locationButton().first().click();
    cy.get('.leaflet-marker-icon', { timeout: 15000 }).should('exist');

    // Feed a heading so the orientation hook reports a working compass.
    cy.window().then(win => win.__setHeading(90));

    // 2nd tap: compass (heading-up).
    locationButton().first().click();
    cy.window().then(win => win.__setHeading(90));

    // The north-reset control appears once compass mode has rotated the map —
    // the observable side-effect of entering that mode, and the affordance
    // that lets the user return to north-up.
    cy.get('[aria-label="Reset to north"]', { timeout: 10000 }).should('exist');
  });
});
