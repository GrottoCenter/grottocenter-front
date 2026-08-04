import React, { useEffect, useState } from 'react';
import { useMapEvent } from 'react-leaflet';
import { useIntl } from 'react-intl';
import {
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  useMediaQuery
} from '@mui/material';
import LocationOn from '@mui/icons-material/LocationOn';
import useWaypoint from '@/hooks/useWaypoint';
import useIsFullscreen from '../useIsFullscreen';
import useMapOverlayContainer from '../useMapOverlayContainer';
import WaypointNavigation from './WaypointNavigation';
import { WAYPOINT_COLOR } from './waypointIcon';

// Self-contained waypoint affordance: long-press the map to drop (or move) the
// navigation target, then follow the distance, bearing and arrow of the HUD.
//
// For maps with no context menu of their own — the entrance map. The global map
// already has a richer menu carrying the same entry, so it wires
// WaypointNavigation itself and must NOT mount this one, or both would answer
// the same 'contextmenu' event.
//
// Fullscreen-only, like the location control it completes: an embedded map a
// few hundred pixels tall is not where anyone walks to a cave. Touch-only, same
// reason — and because long-press is the gesture.
const WaypointControl = () => {
  const { formatMessage } = useIntl();
  const isTouch = useMediaQuery('(pointer: coarse)');
  const [waypoint, setWaypoint] = useWaypoint();
  const isFullscreen = useIsFullscreen();
  const overlayContainer = useMapOverlayContainer();
  // { coords, anchor } while the long-press menu is open, else null.
  const [menu, setMenu] = useState(null);

  useMapEvent('contextmenu', e => {
    if (!isTouch || !isFullscreen) return;
    e.originalEvent.preventDefault();
    setMenu({
      coords: { lat: e.latlng.lat, lng: e.latlng.lng },
      anchor: { top: e.originalEvent.clientY, left: e.originalEvent.clientX }
    });
  });

  // Leaving fullscreen only makes this component render null, it doesn't unmount
  // it — drop any pending menu so it doesn't pop back on the next entry.
  useEffect(() => {
    if (!isFullscreen) setMenu(null);
  }, [isFullscreen]);

  const handlePlaceWaypoint = () => {
    setWaypoint(menu.coords);
    setMenu(null);
  };

  if (!isTouch || !isFullscreen) return null;

  return (
    <>
      {waypoint && (
        <WaypointNavigation
          waypoint={waypoint}
          onDelete={() => setWaypoint(null)}
        />
      )}
      <Menu
        container={overlayContainer}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={menu?.anchor}>
        <MenuItem onClick={handlePlaceWaypoint}>
          <ListItemIcon>
            <LocationOn fontSize="small" sx={{ color: WAYPOINT_COLOR }} />
          </ListItemIcon>
          <ListItemText>
            {formatMessage({
              id: waypoint ? 'Move waypoint here' : 'Place a waypoint here'
            })}
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default WaypointControl;
