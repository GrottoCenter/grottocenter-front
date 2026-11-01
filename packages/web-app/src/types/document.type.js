import PropTypes from 'prop-types';

import authorType from './author.type';
import idNameType from './idName.type';
import { OrganizationSimplePropTypes } from './organization.type';

export const ThumbnailsPropTypes = PropTypes.shape({
  small: PropTypes.string,
  medium: PropTypes.string,
  large: PropTypes.string
});

export const FilePropTypes = PropTypes.shape({
  id: PropTypes.number,
  fileName: PropTypes.string,
  completePath: PropTypes.string,
  pdfPageOffset: PropTypes.number,
  thumbnails: ThumbnailsPropTypes
});

export const DocumentSimplePropTypes = PropTypes.shape({
  id: PropTypes.number.isRequired,
  type: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  identifier: PropTypes.string,
  identifierType: PropTypes.string,
  identifierPdfPageOffset: PropTypes.number,
  files: PropTypes.arrayOf(FilePropTypes)
});

const CitationParentPropTypes = PropTypes.shape({
  id: PropTypes.number.isRequired,
  type: PropTypes.string,
  title: PropTypes.string,
  issue: PropTypes.string,
  datePublication: PropTypes.string,
  parent: PropTypes.shape({
    id: PropTypes.number.isRequired,
    type: PropTypes.string,
    title: PropTypes.string,
    issue: PropTypes.string,
    datePublication: PropTypes.string
  })
});

// The shape of a document as it comes attached to something else: the children
// of a collection (GET /documents/{id}/children) and the documents of an
// entrance, massif, organization or person. Children expose hasFiles; other
// document lists can still provide file metadata.
// Richer than the simple shape: it carries the dates the lists are ordered on
// and the availability information used by their indicators.
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
  hasFiles: PropTypes.bool,
  authors: PropTypes.arrayOf(authorType),
  authorsOrganization: PropTypes.arrayOf(OrganizationSimplePropTypes),
  editor: OrganizationSimplePropTypes,
  library: OrganizationSimplePropTypes,
  parent: CitationParentPropTypes,
  identifier: PropTypes.string,
  identifierType: PropTypes.string,
  issue: PropTypes.string,
  pages: PropTypes.string,
  oldBBS: PropTypes.shape({
    pages: PropTypes.string,
    comments: PropTypes.string,
    publicationOther: PropTypes.string,
    publicationFascicule: PropTypes.string
  }),
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
  creatorComment: PropTypes.string,
  reviewer: authorType,
  validator: authorType,
  validatorComment: PropTypes.string,
  authors: PropTypes.arrayOf(authorType),
  authorsOrganization: PropTypes.arrayOf(OrganizationSimplePropTypes),
  title: PropTypes.string,
  description: PropTypes.string,
  mainLanguage: PropTypes.string,
  languages: PropTypes.arrayOf(PropTypes.string),
  identifier: PropTypes.string,
  identifierType: PropTypes.string,
  identifierPdfPageOffset: PropTypes.number,
  library: OrganizationSimplePropTypes,
  editor: OrganizationSimplePropTypes,
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
    pages: PropTypes.string,
    comments: PropTypes.string,
    publicationOther: PropTypes.string,
    publicationFascicule: PropTypes.string
  }),
  files: PropTypes.arrayOf(FilePropTypes),
  newFiles: PropTypes.arrayOf(FilePropTypes),
  modifiedFiles: PropTypes.arrayOf(FilePropTypes),
  deletedFiles: PropTypes.arrayOf(FilePropTypes)
});
