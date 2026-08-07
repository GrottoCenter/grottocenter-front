import { renderHook, act } from '@testing-library/react';
import useIsFullscreen from './useIsFullscreen';

const handlers = {};
const mockMap = {};

vi.mock('react-leaflet', () => ({
  useMap: () => mockMap,
  useMapEvents: h => {
    Object.assign(handlers, h);
    return mockMap;
  }
}));

beforeEach(() => {
  Object.keys(handlers).forEach(k => delete handlers[k]);
  // Mocking leaflet.fullscreen's own flag — see useIsFullscreen.js.
  // eslint-disable-next-line no-underscore-dangle
  delete mockMap._isFullscreen;
});

describe('useIsFullscreen', () => {
  it('starts false on an ordinary embedded map', () => {
    const { result } = renderHook(() => useIsFullscreen());
    expect(result.current).toBe(false);
  });

  it('follows the enter and exit events', () => {
    const { result } = renderHook(() => useIsFullscreen());
    act(() => handlers.enterFullscreen());
    expect(result.current).toBe(true);

    act(() => handlers.exitFullscreen());
    expect(result.current).toBe(false);
  });

  it('reports fullscreen when mounted into an already fullscreen map', () => {
    // Fullscreen-only features mount *because* the map went fullscreen, so they
    // never receive 'enterFullscreen'. Reading events alone left them believing
    // they were windowed, and their MUI overlays portaled out of the fullscreen
    // element — where a browser paints nothing.
    // eslint-disable-next-line no-underscore-dangle
    mockMap._isFullscreen = true;
    const { result } = renderHook(() => useIsFullscreen());
    expect(result.current).toBe(true);
  });
});
