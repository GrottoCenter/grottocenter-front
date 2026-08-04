import React from 'react';
import PropTypes from 'prop-types';
import useGeolocation from '@/hooks/useGeolocation';
import WaypointLayer from './WaypointLayer';
import WaypointHud from './WaypointHud';
import WaypointOffscreenIndicator from './WaypointOffscreenIndicator';
import { WAYPOINT_MOCK_ENABLED, MOCK_USER_LOCATION } from './waypointMock';

// Mounted only while a waypoint exists, so the continuous position watch (and
// its permission prompt) starts only when the user actually needs navigation.
const WaypointNavigation = ({ waypoint, onDelete }) => {
  const geo = useGeolocation({ watch: !WAYPOINT_MOCK_ENABLED });
  // Dev mock: fake a fixed position so the full UI renders without any real
  // geolocation (see waypointMock.js).
  const location = WAYPOINT_MOCK_ENABLED ? MOCK_USER_LOCATION : geo.location;
  const hasLocation = WAYPOINT_MOCK_ENABLED ? true : geo.hasLocation;
  return (
    <>
      <WaypointLayer
        waypoint={waypoint}
        userLocation={location}
        hasLocation={hasLocation}
        onDelete={onDelete}
      />
      <WaypointOffscreenIndicator waypoint={waypoint} />
      {/* HUD only while navigation is active, i.e. a live position is known. */}
      {hasLocation && (
        <WaypointHud waypoint={waypoint} userLocation={location} />
      )}
    </>
  );
};

WaypointNavigation.propTypes = {
  waypoint: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  }).isRequired,
  onDelete: PropTypes.func.isRequired
};

export default WaypointNavigation;
