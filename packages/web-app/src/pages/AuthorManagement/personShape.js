import PropTypes from 'prop-types';
import { DocumentChildPropTypes } from '@/types/document.type';

export const personShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  type: PropTypes.string.isRequired,
  nickname: PropTypes.string,
  name: PropTypes.string,
  surname: PropTypes.string,
  authoredCount: PropTypes.number,
  documents: PropTypes.arrayOf(DocumentChildPropTypes),
  isDeleted: PropTypes.bool
});

export const pairShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  persons: PropTypes.arrayOf(personShape).isRequired,
  reason: PropTypes.string.isRequired
});
