import PropTypes from 'prop-types';
import authorType from './author.type';

export const DescriptionPropTypes = PropTypes.shape({
  id: PropTypes.number,
  title: PropTypes.string,
  body: PropTypes.string,
  author: authorType,
  reviewer: authorType,
  creationDate: PropTypes.string,
  reviewedDate: PropTypes.string,
  language: PropTypes.string,
  relevance: PropTypes.number
});

export const DescriptionSimpleTypes = PropTypes.shape({
  id: PropTypes.number,
  title: PropTypes.string,
  body: PropTypes.string
});
