import PropTypes from 'prop-types';

// MUI's `sx` prop: a style object, a callback receiving the theme, or an
// array mixing both. Mirrors what @mui/system accepts, minus the runtime cost
// of validating every CSS key.
const sxEntry = PropTypes.oneOfType([
  PropTypes.func,
  PropTypes.shape({}),
  PropTypes.bool
]);

export const sxPropType = PropTypes.oneOfType([
  sxEntry,
  PropTypes.arrayOf(sxEntry)
]);

export default sxPropType;
