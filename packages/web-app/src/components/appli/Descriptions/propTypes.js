import PropTypes from 'prop-types';
import authorType from '../../../types/author.type';

export const descriptionType = PropTypes.shape({
  id: PropTypes.number,
  title: PropTypes.string,
  body: PropTypes.string,
  author: authorType,
  reviewer: authorType,
  creationDate: PropTypes.instanceOf(Date),
  reviewedDate: PropTypes.instanceOf(Date),
  language: PropTypes.string,
  relevance: PropTypes.number
});

export const descriptionsType = PropTypes.arrayOf(descriptionType);
