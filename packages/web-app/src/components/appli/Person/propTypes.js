import PropTypes from 'prop-types';

const EntrancePropTypes = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string
});

export default EntrancePropTypes;
