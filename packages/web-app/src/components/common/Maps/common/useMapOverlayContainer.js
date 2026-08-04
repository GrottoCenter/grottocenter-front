import { useMap } from 'react-leaflet';
import useIsFullscreen from './useIsFullscreen';

// Element that MUI overlays (Menu, Tooltip, …) must portal into.
//
// leaflet.fullscreen makes the MAP CONTAINER itself the fullscreen element, and
// a browser renders nothing outside that element. MUI portals overlays to
// document.body by default, which is outside it — so long-press menus and
// control tooltips exist in the DOM but are never painted while the map is
// fullscreen.
//
// Returns undefined when not fullscreen, keeping MUI's default body portal:
// .leaflet-container is overflow:hidden, so portaling into it on a small
// embedded map would risk clipping the overlay instead.
const useMapOverlayContainer = () => {
  const map = useMap();
  const isFullscreen = useIsFullscreen();
  return isFullscreen ? map.getContainer() : undefined;
};

export default useMapOverlayContainer;
