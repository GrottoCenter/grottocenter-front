import { useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

// Whether the map is currently fullscreen, tracked from the events
// FullscreenControl fires. Several features are fullscreen-only — the location
// control and its marker, the waypoint affordance — because an embedded map a
// few hundred pixels tall is not where anyone navigates in the field.
//
// Map-scoped rather than in src/hooks/: it reads the react-leaflet context, so
// it only works inside a MapContainer (same rule as useMarkers).

// `_isFullscreen` is leaflet.fullscreen's own flag, and the only reading that
// covers native AND pseudo fullscreen alike — the browser's own
// document.fullscreenElement misses the latter, which is what iOS Safari falls
// back to. Kept here so exactly one line in the codebase reaches into the
// plugin's private state: if a leaflet.fullscreen upgrade ever renames it, this
// is the single place to repoint (a `fullscreenchange` DOM listener is the
// obvious fallback, at the cost of missing pseudo fullscreen).
// eslint-disable-next-line no-underscore-dangle
export const isMapFullscreen = map => !!map._isFullscreen;

const useIsFullscreen = () => {
  const map = useMap();
  // Seeded from the map's CURRENT state, not from future events alone: the
  // fullscreen-only features (the location control and its tooltip, the waypoint
  // pin's menu) are mounted *because* the map went fullscreen, so they mount
  // after 'enterFullscreen' has already fired. An event-only hook reported false
  // for their entire lifetime, and their overlays kept portaling out of the
  // fullscreen element — invisible.
  const [isFullscreen, setIsFullscreen] = useState(() => isMapFullscreen(map));
  useMapEvents({
    enterFullscreen: () => setIsFullscreen(true),
    exitFullscreen: () => setIsFullscreen(false)
  });
  return isFullscreen;
};

export default useIsFullscreen;
