import React from 'react';
import PropTypes from 'prop-types';
import {
  useUserLocation,
  useRequestUserLocation
} from '@/components/common/Maps/common/MapLocationContext';
import WaypointLayer from './WaypointLayer';
import WaypointHud from './WaypointHud';
import WaypointOffscreenIndicator from './WaypointOffscreenIndicator';

// Mounted only while a waypoint exists. It requests the map's shared geolocation
// watch (a single source shared with the location marker), so the continuous
// tracking and its permission prompt start only when navigation is needed.
const WaypointNavigation = ({ waypoint, onDelete }) => {
  const { location, hasLocation } = useUserLocation();
  useRequestUserLocation(true);
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
