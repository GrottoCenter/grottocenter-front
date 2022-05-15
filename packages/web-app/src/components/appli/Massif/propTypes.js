import PropTypes from 'prop-types';

const MassifPropTypes = {
  isFetching: PropTypes.bool.isRequired,
  error: PropTypes.shape({}),
  massif: PropTypes.shape({
    name: PropTypes.string,
    names: PropTypes.arrayOf(
      PropTypes.shape({
        language: PropTypes.string
      })
    ),
    descriptions: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        body: PropTypes.string
      })
    ),
    documents: PropTypes.arrayOf(PropTypes.shape({})),
    entrances: PropTypes.arrayOf(PropTypes.shape({})),
    networks: PropTypes.arrayOf(PropTypes.shape({})),
    // eslint-disable-next-line react/forbid-prop-types
    geogPolygon: PropTypes.any
  }),
  onEdit: PropTypes.func.isRequired,
  canEdit: PropTypes.bool.isRequired
};

export default MassifPropTypes;
