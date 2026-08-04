import React from 'react';
import PropTypes from 'prop-types';
import { useUserLocation } from '@/components/common/Maps/common/MapLocationContext';
import WaypointLayer from './WaypointLayer';
import WaypointHud from './WaypointHud';
import WaypointOffscreenIndicator from './WaypointOffscreenIndicator';

// Mounted only while a waypoint exists. It *reads* the map's shared position but
// never requests it: the location control is the single owner of the watch, so
// the button always tells the truth about whether tracking is on.
//
// Requesting it here used to turn the GPS on — permission prompt included — for
// a waypoint merely restored from localStorage, which is a leftover rather than
// a statement of intent, and left the control's button reading "off" while the
// dot was live on the map.
//
// Everything below degrades cleanly without a position: the pin, its delete menu
// and the off-screen indicator stand alone, while the line and the HUD appear as
// soon as the user turns the location control on.
const WaypointNavigation = ({ waypoint, onDelete }) => {
  const { location, hasLocation } = useUserLocation();
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
