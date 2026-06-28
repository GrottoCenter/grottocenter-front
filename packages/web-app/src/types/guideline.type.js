import { string, shape, bool, number, oneOfType, arrayOf } from 'prop-types';
import authorType from './author.type';

const GuidelinePropTypes = shape({
  id: number.isRequired,
  title: string.isRequired,
  description: string,
  countries: arrayOf(string),
  regions: arrayOf(string),
  massifs: arrayOf(shape({ id: number })),
  language: oneOfType([string, shape({ id: string })]),
  author: authorType,
  reviewer: authorType,
  dateInscription: oneOfType([string, number]),
  dateReviewed: oneOfType([string, number]),
  isDeleted: bool
});

export default GuidelinePropTypes;
