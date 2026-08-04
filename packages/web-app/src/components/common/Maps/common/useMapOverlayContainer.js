import { useMap } from 'react-leaflet';
import { isMapFullscreen } from './useIsFullscreen';

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
//
// Deliberately a plain read rather than a subscription: an overlay only needs
// the right container at the instant it renders, and every consumer either
// exists solely in fullscreen (the location control, the waypoint pin's menu) or
// already re-renders on the transition through its own useIsFullscreen (the
// waypoint long-press menu). A component that outlives a fullscreen change
// *without* re-rendering would need useIsFullscreen instead.
const useMapOverlayContainer = () => {
  const map = useMap();
  return isMapFullscreen(map) ? map.getContainer() : undefined;
};

export default useMapOverlayContainer;
