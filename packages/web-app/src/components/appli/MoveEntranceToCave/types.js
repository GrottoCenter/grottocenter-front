import PropTypes from 'prop-types';

export const CaveType = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired
});

export const EntranceType = PropTypes.shape({
  id: PropTypes.number.isRequired,
  cave: PropTypes.shape({
    id: PropTypes.number.isRequired,
    entrances: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired
      })
    ),
    name: PropTypes.string.isRequired
  }).isRequired,
  name: PropTypes.string.isRequired
});
