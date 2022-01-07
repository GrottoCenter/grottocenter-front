import PropTypes from 'prop-types';

export const CaverPropTypes = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string,
  nickname: PropTypes.string,
  surname: PropTypes.string
});

export const EntrancePropTypes = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired
});

export const NetworkPropTypes = PropTypes.shape({
  id: PropTypes.number.isRequired,
  depth: PropTypes.number,
  name: PropTypes.string.isRequired,
  length: PropTypes.number
});
