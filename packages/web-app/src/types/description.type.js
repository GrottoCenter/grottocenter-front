import PropTypes from 'prop-types';
import authorType from './author.type';

export const DescriptionPropTypes = PropTypes.shape({
  id: PropTypes.number,
  title: PropTypes.string,
  body: PropTypes.string,
  author: authorType,
  reviewer: authorType,
  dateInscription: PropTypes.string,
  dateReviewed: PropTypes.string,
  language: PropTypes.string,
  relevance: PropTypes.number
});

export const DescriptionSimpleTypes = PropTypes.shape({
  id: PropTypes.number,
  title: PropTypes.string,
  body: PropTypes.string
});
