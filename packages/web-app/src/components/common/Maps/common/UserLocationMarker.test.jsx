import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import UserLocationMarker from './UserLocationMarker';
import { MapLocationProvider, useUserLocation } from './MapLocationContext';

// --- Mocks ---

const mockMap = { hasLayer: vi.fn(() => false) };
const circleProps = vi.fn();

vi.mock('react-leaflet', () => {
  const { createElement } = require('react');
  return {
    useMap: () => mockMap,
    Circle: props => {
      circleProps(props);
      return createElement('div', { 'data-testid': 'accuracy-circle' });
    }
  };
});

// A minimal L.marker stand-in exposing the element so the cone can be inspected.
let markerInstance;
vi.mock('leaflet', () => {
  const divIcon = opts => ({ options: opts });
  const marker = (latlng, options) => {
    const element = document.createElement('div');
    element.innerHTML = options.icon.options.html;
    markerInstance = {
      options,
      latlng,
      element,
      setLatLng: vi.fn(function setLatLng(next) {
        this.latlng = next;
      }),
      getElement: () => element,
      addTo: vi.fn(),
      remove: vi.fn()
    };
    return markerInstance;
  };
  const api = { divIcon, marker };
  return { __esModule: true, default: api, ...api };
});

// --- Helpers ---

let watchSuccess;

const setupGeolocation = () => {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    writable: true,
    value: {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(success => {
        watchSuccess = success;
        return 3;
      }),
      clearWatch: vi.fn()
    }
  });
};

// Turns the shared watch on, the way the location control does.
const Activate = () => {
  const { enable } = useUserLocation();
  React.useEffect(() => {
    enable();
  }, [enable]);
  return null;
};

const renderMarker = () =>
  render(
    <MapLocationProvider>
      <Activate />
      <UserLocationMarker />
    </MapLocationProvider>
  );

const emitPosition = (coords = {}) =>
  act(() => {
    watchSuccess({
      coords: {
        latitude: 45.111,
        longitude: 5.5244,
        accuracy: 20,
        heading: null,
        speed: null,
        ...coords
      }
    });
  });

const emitHeading = heading =>
  act(() => {
    const event = new Event('deviceorientationabsolute');
    event.absolute = true;
    event.alpha = (360 - heading) % 360;
    window.dispatchEvent(event);
  });

const cone = () => markerInstance.element.querySelector('.user-location-cone');

beforeEach(() => {
  vi.clearAllMocks();
  markerInstance = null;
  setupGeolocation();
  Object.defineProperty(navigator, 'maxTouchPoints', {
    configurable: true,
    writable: true,
    value: 5
  });
});

// --- Tests ---

describe('UserLocationMarker', () => {
  it('creates a marker that rotates with the map view', () => {
    renderMarker();
    expect(markerInstance.options.rotateWithView).toBe(true);
    // It must never intercept clicks meant for the map.
    expect(markerInstance.options.interactive).toBe(false);
  });

  it('places the dot on the map once a fix arrives', async () => {
    renderMarker();
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition();

    await waitFor(() => expect(markerInstance.addTo).toHaveBeenCalled());
    expect(markerInstance.setLatLng).toHaveBeenCalledWith([45.111, 5.5244]);
  });

  it('draws the accuracy circle with the reported radius', async () => {
    renderMarker();
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition({ accuracy: 42 });

    await waitFor(() => {
      const last = circleProps.mock.calls.at(-1)?.[0];
      expect(last?.radius).toBe(42);
    });
  });

  it('hides the direction cone while no heading is known', async () => {
    renderMarker();
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition();

    await waitFor(() => expect(cone().style.display).toBe('none'));
  });

  it('points the cone at the magnetometer heading, even while stationary', async () => {
    renderMarker();
    await waitFor(() => expect(watchSuccess).toBeDefined());
    // Stationary device: the GPS gives no course at all.
    emitPosition({ heading: null, speed: null });
    emitHeading(120);

    await waitFor(() => expect(cone().style.transform).toBe('rotate(120deg)'));
    expect(cone().style.display).not.toBe('none');
  });

  it('falls back to the GPS course when there is no magnetometer', async () => {
    renderMarker();
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition({ heading: 42, speed: 1.5 });

    await waitFor(() => expect(cone().style.transform).toBe('rotate(42deg)'));
  });

  it('prefers the magnetometer over the GPS course', async () => {
    renderMarker();
    await waitFor(() => expect(watchSuccess).toBeDefined());
    emitPosition({ heading: 42, speed: 1.5 });
    emitHeading(200);

    await waitFor(() => expect(cone().style.transform).toBe('rotate(200deg)'));
  });
});
