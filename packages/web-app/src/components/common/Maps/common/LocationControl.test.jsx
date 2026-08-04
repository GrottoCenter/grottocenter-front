import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import LocationControl from './LocationControl';
import { MapLocationProvider } from './MapLocationContext';
import { HEADING_UP_OFFSET_RATIO } from './userLocationStyle';

// --- Mocks ---

const mapEventHandlers = {};
const mockMap = {
  setBearing: vi.fn(),
  getBearing: vi.fn(() => 0),
  setView: vi.fn(),
  getZoom: vi.fn(() => 6),
  getSize: vi.fn(() => ({ x: 800, y: 600 })),
  latLngToContainerPoint: vi.fn(() => ({ x: 400, y: 300 })),
  containerPointToLatLng: vi.fn(point => ({
    lat: 45 + point[1] / 1000,
    lng: 5 + point[0] / 1000
  })),
  fire: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
};

vi.mock('react-leaflet', () => ({
  useMap: () => mockMap,
  // Record the handler so tests can simulate a user drag.
  useMapEvent: (type, handler) => {
    mapEventHandlers[type] = handler;
  },
  // useIsFullscreen (via useMapOverlayContainer) subscribes by handler map.
  useMapEvents: handlers => {
    Object.assign(mapEventHandlers, handlers);
    return mockMap;
  }
}));

vi.mock('./CustomControl', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }) =>
      React.createElement('div', { 'data-testid': 'control' }, children)
  };
});

const mockOnError = vi.fn();
vi.mock('@/hooks', () => ({
  useNotification: () => ({ onError: mockOnError })
}));

// Drives the browser permission state synchronously; the real hook resolves
// asynchronously and has its own suite. 'prompt' is the default so the control
// behaves exactly as it did before auto-start existed.
let permissionState = 'prompt';
vi.mock('@/hooks/useGeolocationPermission', () => ({
  default: () => permissionState
}));

// --- Helpers ---

let watchSuccess;
let watchError;

const setupGeolocation = () => {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    writable: true,
    value: {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn((success, error) => {
        watchSuccess = success;
        watchError = error;
        return 7;
      }),
      clearWatch: vi.fn()
    }
  });
};

const mockWakeLockRequest = vi.fn();

const setupWakeLock = () => {
  mockWakeLockRequest.mockResolvedValue({
    release: vi.fn(),
    addEventListener: vi.fn()
  });
  Object.defineProperty(navigator, 'wakeLock', {
    configurable: true,
    writable: true,
    value: { request: mockWakeLockRequest }
  });
};

// Make useDeviceOrientation believe it runs on a device with a compass.
const setupOrientation = () => {
  Object.defineProperty(navigator, 'maxTouchPoints', {
    configurable: true,
    writable: true,
    value: 5
  });
  window.matchMedia =
    window.matchMedia ||
    (() => ({ matches: true, addListener: () => {}, removeListener: () => {} }));
};

const emitPosition = (coords = {}) =>
  act(() => {
    watchSuccess({
      coords: {
        latitude: 45.111,
        longitude: 5.5244,
        accuracy: 15,
        heading: null,
        speed: null,
        ...coords
      }
    });
  });

// Dispatch an absolute orientation event; computeHeading uses 360 - alpha.
const emitHeading = heading =>
  act(() => {
    const event = new Event('deviceorientationabsolute');
    event.absolute = true;
    event.alpha = (360 - heading) % 360;
    window.dispatchEvent(event);
  });

const tree = (
  <IntlProvider locale="en" messages={{}}>
    <MapLocationProvider>
      <LocationControl />
    </MapLocationProvider>
  </IntlProvider>
);

const renderControl = () => render(tree);

const button = () => screen.getByRole('button');
// The north badge joins the stack in compass mode, so read the main control.
const label = () => screen.getAllByRole('button')[0].getAttribute('aria-label');

beforeEach(() => {
  vi.clearAllMocks();
  permissionState = 'prompt';
  watchSuccess = undefined;
  watchError = undefined;
  mockMap.getZoom.mockReturnValue(6);
  mockMap.getBearing.mockReturnValue(0);
  Object.keys(mapEventHandlers).forEach(k => delete mapEventHandlers[k]);
  setupGeolocation();
  setupOrientation();
  setupWakeLock();
});

// --- Tests ---

describe('LocationControl', () => {
  it('does not track the position until the user activates it', () => {
    renderControl();
    expect(navigator.geolocation.watchPosition).not.toHaveBeenCalled();
  });

  it('starts a single high-accuracy watch on activation', async () => {
    renderControl();
    act(() => button().click());

    await waitFor(() =>
      expect(navigator.geolocation.watchPosition).toHaveBeenCalledTimes(1)
    );
    const options = navigator.geolocation.watchPosition.mock.calls[0][2];
    expect(options.enableHighAccuracy).toBe(true);
  });

  it('recenters on the user and zooms in when activated from far out', async () => {
    renderControl();
    act(() => button().click());
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition();

    await waitFor(() => expect(mockMap.setView).toHaveBeenCalled());
    // Zoom 6 is below focusZoom (13), so the first recenter zooms in.
    const [, zoom] = mockMap.setView.mock.calls[0];
    expect(zoom).toBe(13);
  });

  it('keeps following: a new position triggers another recenter', async () => {
    renderControl();
    act(() => button().click());
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition();
    await waitFor(() => expect(mockMap.setView).toHaveBeenCalled());

    const callsAfterFirstFix = mockMap.setView.mock.calls.length;
    emitPosition({ latitude: 45.2, longitude: 5.6 });

    await waitFor(() =>
      expect(mockMap.setView.mock.calls.length).toBeGreaterThan(
        callsAfterFirstFix
      )
    );
  });

  it('centers the user (no offset) while north-up', async () => {
    renderControl();
    act(() => button().click());
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition();
    await waitFor(() => expect(mockMap.containerPointToLatLng).toHaveBeenCalled());

    // Container point of the user is (400, 300) in a 800x600 map: centered means
    // the requested center keeps the same y.
    const point = mockMap.containerPointToLatLng.mock.calls[0][0];
    expect(point[1]).toBe(300);
  });

  it('rotates the map heading-up and offsets the user downwards in compass mode', async () => {
    renderControl();
    act(() => button().click()); // → follow
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition();
    emitHeading(90);

    act(() => button().click()); // → compass
    emitHeading(90);

    // leaflet-rotate bearing is the opposite of the device heading.
    await waitFor(() => expect(mockMap.setBearing).toHaveBeenCalledWith(-90));

    // The user is pushed to the lower third: the requested center sits above it.
    const offsetCall = mockMap.containerPointToLatLng.mock.calls
      .map(([p]) => p)
      .find(p => p[1] !== 300);
    const expectedY = 300 + 600 * (0.5 - HEADING_UP_OFFSET_RATIO);
    expect(offsetCall[1]).toBeCloseTo(expectedY, 5);
  });

  it('resets the map to north when leaving compass mode via the north button', async () => {
    renderControl();
    act(() => button().click());
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition();
    emitHeading(90);
    act(() => button().click()); // → compass
    emitHeading(90);
    await waitFor(() => expect(mockMap.setBearing).toHaveBeenCalledWith(-90));

    // The round north badge now appears (top-right) to exit compass mode.
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    act(() => buttons[1].click());
    await waitFor(() => expect(mockMap.setBearing).toHaveBeenCalledWith(0));
  });

  it('exits compass mode from the main button, resetting to north', async () => {
    renderControl();
    act(() => button().click());
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition();
    emitHeading(90);
    act(() => button().click()); // → compass
    emitHeading(90);
    await waitFor(() => expect(mockMap.setBearing).toHaveBeenCalledWith(-90));
    expect(screen.getAllByRole('button')).toHaveLength(2);

    // The map already recenters on every fix in compass mode, so the main
    // button closes the cycle instead: back to north-up follow, north button
    // gone — same outcome as tapping the north button itself.
    mockMap.setBearing.mockClear();
    act(() => screen.getAllByRole('button')[0].click());

    await waitFor(() => expect(mockMap.setBearing).toHaveBeenCalledWith(0));
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('straightens the map before recentering when leaving compass mode', async () => {
    renderControl();
    act(() => button().click());
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition();
    emitHeading(90);
    act(() => button().click()); // → compass
    emitHeading(90);
    await waitFor(() => expect(mockMap.setBearing).toHaveBeenCalledWith(-90));

    mockMap.setBearing.mockClear();
    mockMap.setView.mockClear();
    act(() => screen.getAllByRole('button')[0].click()); // → follow
    await waitFor(() => expect(mockMap.setBearing).toHaveBeenCalledWith(0));

    // The recenter target comes from the map's rotation-aware container
    // conversions, so it is only valid for the bearing in force when it is
    // computed. Recentering first aimed at a target built for the old bearing
    // and then rotated it around a pivot caught mid-animation — the map landed
    // off-centre until the next fix silently corrected it.
    expect(mockMap.setView).toHaveBeenCalled();
    expect(mockMap.setBearing.mock.invocationCallOrder[0]).toBeLessThan(
      mockMap.setView.mock.invocationCallOrder[0]
    );
  });

  it('shows a distinct button state for each of the four modes', async () => {
    renderControl();
    // The north button joins the stack in compass mode, so always read the
    // main one: it is the first control rendered.
    const mainButton = () => screen.getAllByRole('button')[0];
    const labelOf = () => mainButton().getAttribute('aria-label');

    expect(labelOf()).toBe('Use my location'); // off
    act(() => mainButton().click());
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition();
    emitHeading(90);
    await waitFor(() => expect(labelOf()).toBe('Compass mode')); // follow

    act(() => mainButton().click());
    await waitFor(() => expect(labelOf()).toBe('Reset to north')); // compass

    act(() => mapEventHandlers.dragstart());
    await waitFor(() =>
      expect(labelOf()).toBe('Recenter on your location') // located
    );
  });

  it('detaches following when a popup opens on the map', async () => {
    renderControl();
    act(() => button().click());
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition();
    await waitFor(() => expect(mockMap.setView).toHaveBeenCalled());

    // Tapping an entrance (or any entity) opens a popup; following would
    // otherwise pan the map away from it on the next fix.
    act(() => mapEventHandlers.popupopen());
    const callsAfterPopup = mockMap.setView.mock.calls.length;

    emitPosition({ latitude: 45.3, longitude: 5.7 });
    await new Promise(r => setTimeout(r, 20));
    expect(mockMap.setView.mock.calls.length).toBe(callsAfterPopup);
  });

  it('stops rotating — and freezes the bearing — on a detach request', async () => {
    renderControl();
    act(() => button().click());
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition();
    emitHeading(90);
    act(() => button().click()); // → compass
    emitHeading(90);
    await waitFor(() => expect(mockMap.setBearing).toHaveBeenCalledWith(-90));

    // Fired by map affordances that move the view without opening a popup
    // (off-screen waypoint badge, cluster dive, geocoding jump).
    act(() => mapEventHandlers.followdetach());
    mockMap.setBearing.mockClear();

    emitHeading(180);
    await new Promise(r => setTimeout(r, 20));
    expect(mockMap.setBearing).not.toHaveBeenCalled();
    // The bearing stays where it was; the north button remains to straighten it.
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('settles the needle on north instead of unwinding a full turn', async () => {
    renderControl();
    act(() => button().click());
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition();
    emitHeading(90);
    act(() => button().click()); // → compass
    emitHeading(90);
    await waitFor(() => expect(mockMap.setBearing).toHaveBeenCalledWith(-90));

    // Freeze the rotation so the north badge stays up while we tap it.
    act(() => mapEventHandlers.followdetach());
    const northButton = () => screen.getAllByRole('button')[1];
    // The needle carries the unwrapped bearing, not a value wrapped to [0, 360).
    expect(northButton().querySelector('svg').style.transform).toBe(
      'rotate(-90deg)'
    );

    // Straightening must reach north the short way: assigning 0 outright would
    // have animated -90° → 0° here, but +270° once the user had turned around.
    act(() => northButton().click());
    await waitFor(() => expect(screen.getAllByRole('button')).toHaveLength(1));
  });

  it('detaches following when the user drags the map', async () => {
    renderControl();
    act(() => button().click());
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition();
    await waitFor(() => expect(mockMap.setView).toHaveBeenCalled());

    // Simulate a user pan.
    act(() => mapEventHandlers.dragstart());
    const callsAfterDrag = mockMap.setView.mock.calls.length;

    // A new fix must no longer move the map.
    emitPosition({ latitude: 45.3, longitude: 5.7 });
    await new Promise(r => setTimeout(r, 20));
    expect(mockMap.setView.mock.calls.length).toBe(callsAfterDrag);
  });

  it('reports a denied permission instead of failing silently', async () => {
    renderControl();
    act(() => button().click());
    await waitFor(() => expect(watchError).toBeDefined());

    act(() => watchError({ code: 1 }));

    await waitFor(() => expect(mockOnError).toHaveBeenCalledTimes(1));
  });

  it('re-notifies and drops back to off when the user retries after a denial', async () => {
    renderControl();
    act(() => button().click());
    await waitFor(() => expect(watchError).toBeDefined());
    act(() => watchError({ code: 1 }));
    await waitFor(() => expect(mockOnError).toHaveBeenCalledTimes(1));

    // Retry: without clearing the stale error, the second denial was silent.
    act(() => button().click());
    await waitFor(() =>
      expect(navigator.geolocation.watchPosition).toHaveBeenCalledTimes(2)
    );
    act(() => watchError({ code: 1 }));

    await waitFor(() => expect(mockOnError).toHaveBeenCalledTimes(2));
  });

  describe('already-granted permission', () => {
    it('shows the position on arrival, without a tap and without a dialog', async () => {
      permissionState = 'granted';
      renderControl();

      await waitFor(() =>
        expect(navigator.geolocation.watchPosition).toHaveBeenCalledTimes(1)
      );
      emitPosition();

      // LOCATED, never FOLLOW: the dot and its accuracy circle appear, but a map
      // the user may have opened on a specific target is not ours to move.
      await waitFor(() => expect(label()).toBe('Recenter on your location'));
      expect(mockMap.setView).not.toHaveBeenCalled();
    });

    it('leaves the screen alone until the user asks to navigate', async () => {
      permissionState = 'granted';
      renderControl();
      await waitFor(() => expect(watchSuccess).toBeDefined());
      emitPosition();
      await waitFor(() => expect(label()).toBe('Recenter on your location'));

      // Tracking nobody asked for must not burn the battery keeping the screen
      // lit; only a deliberate tap is a statement of intent to navigate.
      expect(mockWakeLockRequest).not.toHaveBeenCalled();

      act(() => button().click()); // LOCATED → FOLLOW
      await waitFor(() => expect(mockWakeLockRequest).toHaveBeenCalled());
    });

    it('zooms in and asks for the compass on the first tap after an auto-start', async () => {
      permissionState = 'granted';
      renderControl();
      await waitFor(() => expect(watchSuccess).toBeDefined());
      emitPosition();
      await waitFor(() => expect(label()).toBe('Recenter on your location'));

      act(() => button().click());

      // LOCATED was reached without a gesture, so this tap is the real
      // activation: zoom 6 is below focusZoom, and iOS only grants the
      // orientation permission from inside a gesture.
      await waitFor(() => expect(mockMap.setView).toHaveBeenCalled());
      const [, zoom] = mockMap.setView.mock.calls[0];
      expect(zoom).toBe(13);
    });

    it('keeps tracking through a spurious denial', async () => {
      permissionState = 'granted';
      renderControl();
      await waitFor(() => expect(watchError).toBeDefined());
      emitPosition();
      await waitFor(() => expect(label()).toBe('Recenter on your location'));

      act(() => watchError({ code: 1 }));

      // Chrome reports code 1 for a dialog merely dismissed, and again — with no
      // dialog at all — once an origin is under its auto-embargo. Treating every
      // code 1 as final is what silently killed tracking mid-session.
      await waitFor(() => expect(mockOnError).toHaveBeenCalledTimes(1));
      expect(label()).toBe(
        'Location access denied. Enable it in your browser settings.'
      );
    });

    it('does not demote a user activation when the permission lands afterwards', async () => {
      const view = renderControl();
      act(() => button().click()); // → follow
      await waitFor(() => expect(watchSuccess).toBeDefined());
      emitPosition();
      emitHeading(90);
      await waitFor(() => expect(label()).toBe('Compass mode'));

      // The user answered the dialog: PermissionStatus fires 'change'. The tap
      // must have closed the auto-start, or the arriving 'granted' would pull
      // FOLLOW back down to LOCATED and undo it.
      permissionState = 'granted';
      act(() => view.rerender(tree));

      expect(label()).toBe('Compass mode');
    });
  });

  it('says so immediately instead of starting a doomed watch when blocked', async () => {
    permissionState = 'denied';
    renderControl();

    act(() => button().click());

    await waitFor(() => expect(mockOnError).toHaveBeenCalledTimes(1));
    // No dialog will ever come back from here, so a watch would only buy a
    // doomed acquisition and a delayed toast.
    expect(navigator.geolocation.watchPosition).not.toHaveBeenCalled();
  });

  it('signals compass follow state so heavy layers can react', async () => {
    renderControl();
    act(() => button().click());
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition();
    emitHeading(90);
    act(() => button().click()); // → compass

    await waitFor(() =>
      expect(mockMap.fire).toHaveBeenCalledWith('compassfollowchange', {
        following: true
      })
    );
  });
});
