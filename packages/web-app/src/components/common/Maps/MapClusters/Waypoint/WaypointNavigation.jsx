import React from 'react';
import PropTypes from 'prop-types';
import useGeolocation from '@/hooks/useGeolocation';
import WaypointLayer from './WaypointLayer';
import WaypointHud from './WaypointHud';
import WaypointOffscreenIndicator from './WaypointOffscreenIndicator';

// Mounted only while a waypoint exists, so the continuous position watch (and
// its permission prompt) starts only when the user actually needs navigation.
const WaypointNavigation = ({ waypoint, onDelete }) => {
  const { location, hasLocation } = useGeolocation({ watch: true });
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
      {!hasLocation && (
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
