import { string, shape, bool, number, oneOfType } from 'prop-types';
import authorType from './author.type';

const GuidelinePropTypes = shape({
  id: number.isRequired,
  title: string.isRequired,
  description: string,
  language: string,
  author: authorType,
  reviewer: authorType,
  dateInscription: oneOfType([string, number]),
  dateReviewed: oneOfType([string, number]),
  isDeleted: bool
});

export default GuidelinePropTypes;
