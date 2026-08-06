import PropTypes from 'prop-types';
import idNameType from './idName.type';
import { DescriptionSimpleTypes } from './description.type';

export const MassifSimpleTypes = idNameType;

export const MassifTypes = PropTypes.shape({
  isDeleted: PropTypes.bool,
  id: PropTypes.number,
  name: PropTypes.string,
  names: PropTypes.arrayOf(
    PropTypes.shape({
      language: PropTypes.string
    })
  ),
  language: PropTypes.string,
  isSensitive: PropTypes.bool,
  isSensitiveLocked: PropTypes.bool,
  geogPolygon: PropTypes.string,
  descriptions: PropTypes.arrayOf(DescriptionSimpleTypes),
  networks: PropTypes.arrayOf(PropTypes.shape({})),
  documents: PropTypes.arrayOf(PropTypes.shape({}))
});
