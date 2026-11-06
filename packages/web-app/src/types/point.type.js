import PropTypes from 'prop-types';
import authorType from './author.type';

const pointType = PropTypes.shape({
  id: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  caveId: PropTypes.number,
  underground: PropTypes.bool,
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  isDeleted: PropTypes.bool,
  author: authorType,
  reviewer: authorType,
  dateInscription: PropTypes.string,
  dateReviewed: PropTypes.string
});

export default pointType;
