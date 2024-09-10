import PropTypes from 'prop-types';

import authorType from './author.type';
import { DescriptionPropTypes } from './description.type';
import { NamePropTypes } from './name.type';

export const EntranceSimplePropTypes = PropTypes.shape({
  id: PropTypes.number,
  isDeleted: PropTypes.bool,
  name: PropTypes.string,
  region: PropTypes.string,
  country: PropTypes.string,
  county: PropTypes.string,
  city: PropTypes.string,
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  isSensitive: PropTypes.bool
});

export const CavePropTypes = PropTypes.shape({
  isDeleted: PropTypes.bool,
  id: PropTypes.number,
  name: PropTypes.string,
  author: authorType,
  creationDate: PropTypes.string,
  reviewer: authorType,
  reviewedDate: PropTypes.string,
  length: PropTypes.number,
  depth: PropTypes.number,
  temperature: PropTypes.number,
  isDiving: PropTypes.bool,

  names: PropTypes.arrayOf(NamePropTypes),
  descriptions: PropTypes.arrayOf(DescriptionPropTypes),
  entrances: PropTypes.arrayOf(
    PropTypes.oneOfType([EntranceSimplePropTypes, PropTypes.number])
  ),
  documents: PropTypes.arrayOf(PropTypes.shape({}))
});
