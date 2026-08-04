import { useState } from 'react';
import { useMapEvents } from 'react-leaflet';

// Whether the map is currently fullscreen, tracked from the events
// FullscreenControl fires. Several features are fullscreen-only — the location
// control and its marker, the waypoint affordance — because an embedded map a
// few hundred pixels tall is not where anyone navigates in the field.
//
// Map-scoped rather than in src/hooks/: it reads the react-leaflet context, so
// it only works inside a MapContainer (same rule as useMarkers).
const useIsFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  useMapEvents({
    enterFullscreen: () => setIsFullscreen(true),
    exitFullscreen: () => setIsFullscreen(false)
  });
  return isFullscreen;
};

export default useIsFullscreen;
