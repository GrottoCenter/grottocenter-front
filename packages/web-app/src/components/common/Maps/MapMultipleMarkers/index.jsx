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

const MultipleMarkers = ({ validPositions }) => {
  const map = useMap();
  const updateEntranceMarkers = useMarkers({
    icon: EntranceMarker,
    tooltipContent: entrance => entrance.name,
    shouldFitMapBound: true
  });

  useEffect(() => {
    if (validPositions.length === 0) return;
    updateEntranceMarkers(validPositions);

    // fitBounds (called inside updateEntranceMarkers on first load) may run
    // before Leaflet's ResizeObserver settles the map dimensions. Re-fit once
    // after the first resize event so all markers are guaranteed to be visible.
    const latLngs = validPositions.map(p => [p.latitude, p.longitude]);
    const onResize = () => {
      map.fitBounds(latLngs, { padding: [40, 40], maxZoom: 16 });
      map.off('resize', onResize);
    };
    map.on('resize', onResize);
    return () => map.off('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validPositions]);

  return null;
};

MultipleMarkers.propTypes = {
  validPositions: PropTypes.arrayOf(PropTypes.shape({})).isRequired
};

const MapMultipleMarkers = ({ style, zoom, positions }) => {
  const validPositions = useMemo(() => filterValidPositions(positions), [positions]);
  if (validPositions.length === 0) return null;

  return (
    <CustomMapContainer
      wholePage={false}
      dragging={!isMobile} // For usability only use two fingers drag/zoom on mobile
      scrollWheelZoom={false}
      style={style}
      zoom={zoom || 14}>
      <MultipleMarkers validPositions={validPositions} />
    </CustomMapContainer>
  );
};

MapMultipleMarkers.propTypes = {
  positions: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  style: PropTypes.shape({}),
  zoom: PropTypes.number
};

export default MapMultipleMarkers;
