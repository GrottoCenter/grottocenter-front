import PropTypes from 'prop-types';

import authorType from './author.type';

// eslint-disable-next-line import/prefer-default-export
export const NamePropTypes = PropTypes.shape({
  isDeleted: PropTypes.bool,
  id: PropTypes.number,
  name: PropTypes.string,
  author: PropTypes.oneOfType([authorType, PropTypes.number]),
  reviewer: PropTypes.oneOfType([authorType, PropTypes.number]),
  dateInscription: PropTypes.string,
  dateReviewed: PropTypes.string
});
