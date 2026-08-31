import { string, shape, bool, number, oneOfType, arrayOf } from 'prop-types';
import authorType from './author.type';

const GuidelinePropTypes = shape({
  id: number.isRequired,
  title: string.isRequired,
  description: string,
  countries: arrayOf(
    oneOfType([
      string,
      number,
      shape({ id: oneOfType([string, number]), name: string })
    ])
  ),
  regions: arrayOf(
    oneOfType([
      string,
      number,
      shape({
        id: oneOfType([string, number]),
        iso: string,
        name: string,
        countryId: string
      })
    ])
  ),
  massifs: arrayOf(
    oneOfType([
      string,
      number,
      shape({ id: oneOfType([string, number]), name: string })
    ])
  ),
  language: oneOfType([
    string,
    shape({ id: string, name: string, refName: string })
  ]),
  author: authorType,
  reviewer: authorType,
  dateInscription: oneOfType([string, number]),
  dateReviewed: oneOfType([string, number]),
  isDeleted: bool
});

export default GuidelinePropTypes;
