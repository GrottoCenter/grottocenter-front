import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useMap } from 'react-leaflet';
import { isMobile } from 'react-device-detect';
import CustomMapContainer from '../common/MapContainer';
import useMarkers from '../common/Markers/useMarkers';
import { EntranceMarker } from '../common/Markers/Components';

export const filterValidPositions = positions =>
  (positions ?? []).filter(
    e => typeof e.latitude === 'number' && typeof e.longitude === 'number'
  );

const MultipleMarkers = ({ positions, zoom }) => {
  const map = useMap();
  const updateEntranceMarkers = useMarkers({
    icon: EntranceMarker,
    tooltipContent: entrance => entrance.name,
    shouldFitMapBound: true
  });

  if (zoom) map.setZoom(zoom);

  const validPositions = useMemo(
    () => filterValidPositions(positions),
    [positions]
  );

  useEffect(() => {
    if (validPositions.length === 0) return;
    updateEntranceMarkers(validPositions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validPositions]);

  return null;
};

const MapMultipleMarkers = ({ style, zoom, ...otherProps }) => (
  <CustomMapContainer
    wholePage={false}
    dragging={!isMobile} // For usability only use two fingers drag/zoom on mobile
    viewport={null}
    scrollWheelZoom={false}
    style={style}
    zoom={zoom || 14}>
    <MultipleMarkers {...otherProps} zoom={zoom || 14} />
  </CustomMapContainer>
);

// eslint-disable-next-line no-multi-assign
MapMultipleMarkers.propTypes = MultipleMarkers.propTypes = {
  positions: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  style: PropTypes.shape({}),
  zoom: PropTypes.number
};

export default MapMultipleMarkers;
