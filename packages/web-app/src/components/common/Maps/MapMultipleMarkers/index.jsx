import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  is,
  isEmpty,
  pipe,
  length,
  equals,
  all,
  allPass,
  flatten,
  isNil
} from 'ramda';
import { useMap } from 'react-leaflet';
import CustomMapContainer from '../common/MapContainer';
import useMarkers from '../common/Markers/useMarkers';
import { EntranceMarker } from '../common/Markers/Components';

const isPair = pipe(length, equals(2));
const isNumber = pipe(flatten, all(is(Number)));
export const isValidPositions = allPass([
  is(Array),
  all(is(Array)),
  all(isPair),
  isNumber
]);

const makePosition = pos => ({ latitude: pos[0], longitude: pos[1] });

const MultipleMarkers = ({ positions, zoom }) => {
  const map = useMap();
  const updateEntranceMarkers = useMarkers(EntranceMarker);

  if (!isNil(zoom)) {
    map.setZoom(zoom);
  }
  useEffect(() => {
    updateEntranceMarkers(positions.map(makePosition));
    if (
      !isNil(positions) &&
      !isEmpty(positions) &&
      positions.every(p => !isNil(p[0]) && !isNil(p[1]))
    ) {
      map.fitBounds(positions);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions]);

  return null;
};

const HydratedMultipleMarkers = ({ style, zoom, ...otherProps }) => (
  <CustomMapContainer
    wholePage={false}
    dragging={false}
    viewport={null}
    scrollWheelZoom={false}
    style={style}
    zoom={zoom || 14}>
    <MultipleMarkers {...otherProps} zoom={zoom} />
  </CustomMapContainer>
);

// eslint-disable-next-line no-multi-assign
HydratedMultipleMarkers.propTypes = MultipleMarkers.propTypes = {
  positions: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  style: PropTypes.shape({}),
  zoom: PropTypes.number
};

export default HydratedMultipleMarkers;
