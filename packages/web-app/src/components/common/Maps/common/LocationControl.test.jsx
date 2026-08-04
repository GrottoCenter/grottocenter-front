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

const renderControl = () =>
  render(
    <IntlProvider locale="en" messages={{}}>
      <MapLocationProvider>
        <LocationControl />
      </MapLocationProvider>
    </IntlProvider>
  );

const button = () => screen.getByRole('button');

beforeEach(() => {
  vi.clearAllMocks();
  mockMap.getZoom.mockReturnValue(6);
  mockMap.getBearing.mockReturnValue(0);
  Object.keys(mapEventHandlers).forEach(k => delete mapEventHandlers[k]);
  setupGeolocation();
  setupOrientation();
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

    // A second button now appears, stacked above, to exit compass mode.
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    act(() => buttons[1].click());
    await waitFor(() => expect(mockMap.setBearing).toHaveBeenCalledWith(0));
  });

  it('recentering while in compass mode does not exit it', async () => {
    renderControl();
    act(() => button().click());
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition();
    emitHeading(90);
    act(() => button().click()); // → compass
    emitHeading(90);
    await waitFor(() => expect(mockMap.setBearing).toHaveBeenCalledWith(-90));

    // Clicking the location button itself only recenters, it no longer exits
    // compass mode — that is the separate north button's job now.
    mockMap.setBearing.mockClear();
    act(() => screen.getAllByRole('button')[0].click());
    expect(mockMap.setBearing).not.toHaveBeenCalled();
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
