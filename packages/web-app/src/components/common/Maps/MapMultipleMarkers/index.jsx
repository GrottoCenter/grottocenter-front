import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useMap } from 'react-leaflet';
import { isMobile } from 'react-device-detect';
import CustomMapContainer from '../common/MapContainer';
import useMarkers from '../common/Markers/useMarkers';
import { EntranceMarker } from '../common/Markers/Components';
import MeasureControl from '../common/MeasureControl';

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

    const latLngs = validPositions.map(p => [p.latitude, p.longitude]);
    const fitBounds = () =>
      map.fitBounds(latLngs, { padding: [40, 40], maxZoom: 16 });

    const container = map.getContainer();
    let wasHidden =
      container.clientWidth === 0 || container.clientHeight === 0;

    // Re-fit bounds each time the map transitions from hidden to visible.
    // The one-shot pattern broke tab navigation: invalidateSize() fires 'resize'
    // when returning to the tab, but the listener had already been removed.
    const onResize = () => {
      const { clientWidth, clientHeight } = container;
      const isVisible = clientWidth > 0 && clientHeight > 0;
      if (wasHidden && isVisible) fitBounds();
      wasHidden = !isVisible;
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
      zoom={zoom || 14}
      // Field-navigation helpers, only in fullscreen. The compass button
      // self-hides on non-touch devices, so it stays mobile-only.
      isLocateControlInFullscreen
      isCompassControlInFullscreen>
      <MultipleMarkers validPositions={validPositions} />
      <MeasureControl />
    </CustomMapContainer>
  );
};

MapMultipleMarkers.propTypes = {
  positions: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  style: PropTypes.shape({}),
  zoom: PropTypes.number
};

export default MapMultipleMarkers;
