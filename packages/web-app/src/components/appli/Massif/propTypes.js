import PropTypes from 'prop-types';

const MassifPropTypes = {
  isFetching: PropTypes.bool.isRequired,
  error: PropTypes.shape({}),
  descriptions: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      body: PropTypes.string
    })
  ),
  details: PropTypes.shape({
    name: PropTypes.string,
    names: PropTypes.arrayOf(
      PropTypes.shape({
        language: PropTypes.string
      })
    ),
    geogPolygon: PropTypes.string
  }),
  entrances: PropTypes.arrayOf(PropTypes.shape({})),
  networks: PropTypes.arrayOf(PropTypes.shape({})),
  documents: PropTypes.arrayOf(PropTypes.shape({})),
  onEdit: PropTypes.func.isRequired,
  canEdit: PropTypes.bool.isRequired,
  onSubscribe: PropTypes.func.isRequired,
  onUnsubscribe: PropTypes.func.isRequired,
  canSubscribe: PropTypes.bool.isRequired
};

export default MassifPropTypes;
