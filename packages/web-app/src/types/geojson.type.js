import PropTypes from 'prop-types';

// GeoJSON nests coordinates one level deeper per geometry type:
// a position is [lng, lat], a ring is a list of positions, a Polygon is a
// list of rings (outer first, then holes), a MultiPolygon a list of Polygons.
const positionPropType = PropTypes.arrayOf(PropTypes.number);
const ringPropType = PropTypes.arrayOf(positionPropType);
const polygonCoordinatesPropType = PropTypes.arrayOf(ringPropType);
const multiPolygonCoordinatesPropType = PropTypes.arrayOf(
  polygonCoordinatesPropType
);

export const areaCoordinatesPropType = PropTypes.oneOfType([
  polygonCoordinatesPropType,
  multiPolygonCoordinatesPropType
]);

export default areaCoordinatesPropType;
