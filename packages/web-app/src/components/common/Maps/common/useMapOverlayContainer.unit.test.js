import { renderHook } from '@testing-library/react';
import useMapOverlayContainer from './useMapOverlayContainer';

const mapContainer = { id: 'leaflet-container' };
const mockMap = { getContainer: () => mapContainer };

vi.mock('react-leaflet', () => ({
  useMap: () => mockMap,
  useMapEvents: () => mockMap
}));

beforeEach(() => {
  delete mockMap._isFullscreen;
});

describe('useMapOverlayContainer', () => {
  it('leaves MUI its default body portal on a windowed map', () => {
    // .leaflet-container is overflow:hidden — portaling into a small embedded
    // map would clip the overlay rather than fix anything.
    const { result } = renderHook(() => useMapOverlayContainer());
    expect(result.current).toBeUndefined();
  });

  it('portals into the map container once fullscreen', () => {
    // The map container IS the fullscreen element, and a browser paints nothing
    // outside it: an overlay left on document.body is simply never shown.
    mockMap._isFullscreen = true;
    const { result } = renderHook(() => useMapOverlayContainer());
    expect(result.current).toBe(mapContainer);
  });
});
