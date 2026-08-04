import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Marker, Polyline } from 'react-leaflet';
import * as L from 'leaflet';
import { useIntl } from 'react-intl';
import {
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  useTheme
} from '@mui/material';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import waypointIcon, { WAYPOINT_COLOR } from './waypointIcon';

const pointShape = PropTypes.shape({
  lat: PropTypes.number.isRequired,
  lng: PropTypes.number.isRequired
});

// Renders the waypoint pin, the as-the-crow-flies line to the user (only when a
// live position is available), and — on a long-press / right-click of the pin —
// a small context menu to delete it.
const WaypointLayer = ({ waypoint, userLocation, hasLocation, onDelete }) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState(null);

  const handleMarkerContextMenu = e => {
    // Suppress the native browser menu, and pass the *Leaflet* event to
    // stopPropagation so it flags originalEvent._stopped — that stops Leaflet
    // from also firing 'contextmenu' on the map (which would open the map's
    // coordinate menu on top of ours).
    e.originalEvent.preventDefault();
    L.DomEvent.stopPropagation(e);
    setMenuAnchor({
      top: e.originalEvent.clientY,
      left: e.originalEvent.clientX
    });
  };

  const handleDelete = () => {
    setMenuAnchor(null);
    onDelete();
  };

  return (
    <>
      {hasLocation && (
        <Polyline
          positions={[
            [userLocation.lat, userLocation.lng],
            [waypoint.lat, waypoint.lng]
          ]}
          pathOptions={{
            color: theme.palette.primary.main,
            weight: 3,
            opacity: 0.9,
            dashArray: '6, 8'
          }}
        />
      )}
      <Marker
        position={[waypoint.lat, waypoint.lng]}
        icon={waypointIcon}
        keyboard={false}
        eventHandlers={{ contextmenu: handleMarkerContextMenu }}
      />
      <Menu
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorReference="anchorPosition"
        anchorPosition={menuAnchor}>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <LocationOffIcon fontSize="small" sx={{ color: WAYPOINT_COLOR }} />
          </ListItemIcon>
          <ListItemText>{formatMessage({ id: 'Remove waypoint' })}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

WaypointLayer.propTypes = {
  waypoint: pointShape.isRequired,
  userLocation: pointShape.isRequired,
  hasLocation: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default WaypointLayer;
