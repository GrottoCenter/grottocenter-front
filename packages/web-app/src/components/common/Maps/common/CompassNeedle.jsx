import React from 'react';
import PropTypes from 'prop-types';

// Two-tone compass needle: the coloured tip points to true North. Rotated by the
// current map bearing so it keeps indicating North on a rotated map. Shared by
// the location control (compass mode) and the north-reset control.
const CompassNeedle = ({ bearing, northColor, southColor, size = 36 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
    style={{
      transform: `rotate(${bearing}deg)`,
      transition: 'transform 0.1s linear'
    }}>
    <polygon points="12,1 17,12 7,12" fill={northColor} />
    <polygon points="12,23 17,12 7,12" fill={southColor} />
  </svg>
);

CompassNeedle.propTypes = {
  bearing: PropTypes.number.isRequired,
  northColor: PropTypes.string.isRequired,
  southColor: PropTypes.string.isRequired,
  size: PropTypes.number
};

export default CompassNeedle;
