import PropTypes from 'prop-types';

import authorType from './author.type';
import idNameType from './idName.type';

export const ThumbnailsPropTypes = PropTypes.shape({
  small: PropTypes.string,
  medium: PropTypes.string,
  large: PropTypes.string
});

export const FilePropTypes = PropTypes.shape({
  fileName: PropTypes.string,
  completePath: PropTypes.string,
  thumbnails: ThumbnailsPropTypes
});

export const DocumentSimplePropTypes = PropTypes.shape({
  id: PropTypes.number.isRequired,
  title: PropTypes.string,
  description: PropTypes.string
});

// Shape returned by GET /documents/{id}/children — richer than the simple
// shape: it carries the publication date the list is ordered on and the files
// the availability indicator is derived from.
export const DocumentChildPropTypes = PropTypes.shape({
  id: PropTypes.number.isRequired,
  type: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  datePublication: PropTypes.string,
  dateInscription: PropTypes.string,
  dateReviewed: PropTypes.string,
  isValidated: PropTypes.bool,
  isDeleted: PropTypes.bool,
  files: PropTypes.arrayOf(FilePropTypes)
});

export const DocumentPropTypes = PropTypes.shape({
  id: PropTypes.number,
  importSource: PropTypes.string,
  importId: PropTypes.number,
  type: PropTypes.string,
  isValidated: PropTypes.bool,
  dateInscription: PropTypes.string,
  dateReviewed: PropTypes.string,
  dateValidation: PropTypes.string,
  datePublication: PropTypes.string,
  creator: authorType,
  reviewer: authorType,
  validator: authorType,
  authors: PropTypes.arrayOf(authorType),
  authorsOrganization: PropTypes.arrayOf(idNameType),
  title: PropTypes.string,
  description: PropTypes.string,
  mainLanguage: PropTypes.string,
  identifier: PropTypes.string,
  identifierType: PropTypes.string,
  library: idNameType,
  editor: idNameType,
  subjects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      subject: PropTypes.string
    })
  ),
  issue: PropTypes.string,
  pages: PropTypes.string,
  license: PropTypes.string,
  iso3166: PropTypes.arrayOf(
    PropTypes.shape({
      iso: PropTypes.string,
      name: PropTypes.string
    })
  ),
  authorizationDocument: DocumentSimplePropTypes,
  cave: idNameType,
  entrances: PropTypes.arrayOf(idNameType),
  massifs: PropTypes.arrayOf(idNameType),
  parent: DocumentSimplePropTypes,
  oldBBS: PropTypes.shape({
    publicationOther: PropTypes.string,
    publicationFascicule: PropTypes.string
  }),
  files: PropTypes.arrayOf(FilePropTypes)
});
