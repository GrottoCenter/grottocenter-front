import PropTypes from 'prop-types';

import idNameType from './idName.type';
import authorType from './author.type';
import { DescriptionPropTypes } from './description.type';

import { NamePropTypes } from './name.type';
import { CavePropTypes } from './cave.type';

export const CommentPropTypes = PropTypes.shape({
  id: PropTypes.number,
  isDeleted: PropTypes.bool,
  title: PropTypes.string,
  body: PropTypes.string,
  author: authorType.isRequired,
  reviewer: authorType,
  dateInscription: PropTypes.string,
  dateReviewed: PropTypes.string,
  relevance: PropTypes.number,
  aestheticism: PropTypes.number,
  approach: PropTypes.number,
  eTTrail: PropTypes.string, // hh:mm:ss
  eTUnderground: PropTypes.string, // hh:mm:ss
  language: PropTypes.string
});

export const DocumentPropTypes = PropTypes.shape({
  id: PropTypes.number,
  isDeleted: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string,
  dateInscription: PropTypes.string,
  dateReviewed: PropTypes.string,
  files: PropTypes.arrayOf(PropTypes.string)
});

export const HistoryPropTypes = PropTypes.shape({
  id: PropTypes.number.isRequired,
  isDeleted: PropTypes.bool,
  body: PropTypes.string.isRequired,
  author: authorType.isRequired,
  reviewer: authorType,
  dateInscription: PropTypes.string,
  dateReviewed: PropTypes.string,
  relevance: PropTypes.number,
  language: PropTypes.string
});

export const LocationPropTypes = PropTypes.shape({
  id: PropTypes.number,
  isDeleted: PropTypes.bool,
  title: PropTypes.string,
  body: PropTypes.string,
  author: authorType.isRequired,
  reviewer: authorType,
  dateInscription: PropTypes.string,
  dateReviewed: PropTypes.string,
  relevance: PropTypes.number,
  language: PropTypes.string
});

export const ObstaclePropTypes = PropTypes.shape({
  obstacle: PropTypes.string,
  rope: PropTypes.string,
  observation: PropTypes.string,
  anchor: PropTypes.string
});

export const RiggingPropTypes = PropTypes.shape({
  id: PropTypes.number.isRequired,
  isDeleted: PropTypes.bool,
  title: PropTypes.string.isRequired,
  obstacles: PropTypes.arrayOf(ObstaclePropTypes),
  author: authorType,
  reviewer: authorType,
  dateInscription: PropTypes.string,
  dateReviewed: PropTypes.string,
  relevance: PropTypes.number,
  language: PropTypes.string
});

export const DataQualityPropTypes = PropTypes.shape({
  total: PropTypes.number,
  categories: PropTypes.shape({
    general: PropTypes.number,
    location: PropTypes.number,
    description: PropTypes.number,
    document: PropTypes.number,
    rigging: PropTypes.number,
    history: PropTypes.number,
    comment: PropTypes.number
  })
});

export const EntrancePropTypes = PropTypes.shape({
  id: PropTypes.number,
  isDeleted: PropTypes.bool,
  redirectTo: PropTypes.number,
  name: PropTypes.string,
  names: PropTypes.arrayOf(NamePropTypes),
  author: authorType,
  reviewer: authorType,
  dateInscription: PropTypes.string,
  dateReviewed: PropTypes.string,

  cave: CavePropTypes,
  region: PropTypes.string,
  country: PropTypes.string,
  county: PropTypes.string,
  city: PropTypes.string,
  discoveryYear: PropTypes.number,
  isSensitive: PropTypes.bool,
  isSensitiveLocked: PropTypes.bool,
  hasBat: PropTypes.bool,
  dangerFlooding: PropTypes.bool,
  dangerCo2: PropTypes.bool,
  dangerRockfall: PropTypes.bool,
  dangerPollution: PropTypes.bool,
  needCleanGear: PropTypes.bool,
  needStayOnTrail: PropTypes.bool,
  hasRules: PropTypes.bool,
  isTouristic: PropTypes.bool,
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  altitude: PropTypes.number,
  precision: PropTypes.number,

  massifs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      undergroundType: PropTypes.string
    })
  ),
  documents: PropTypes.arrayOf(DocumentPropTypes),
  locations: PropTypes.arrayOf(LocationPropTypes),
  descriptions: PropTypes.arrayOf(DescriptionPropTypes),
  riggings: PropTypes.arrayOf(RiggingPropTypes),
  histories: PropTypes.arrayOf(HistoryPropTypes),
  comments: PropTypes.arrayOf(CommentPropTypes),
  dataQuality: DataQualityPropTypes,
  stats: PropTypes.shape({
    aestheticism: PropTypes.number,
    caving: PropTypes.number,
    approach: PropTypes.number
  })
});

export const EntranceSimplePropTypes = idNameType;
