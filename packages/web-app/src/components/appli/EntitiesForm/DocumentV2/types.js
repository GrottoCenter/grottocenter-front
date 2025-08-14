import PropTypes from 'prop-types';

export const subjectType = PropTypes.shape({
  id: PropTypes.string,
  parent: PropTypes.shape({}),
  subject: PropTypes.string
});

export const simpleCaverType = PropTypes.shape({
  id: PropTypes.number,
  nickname: PropTypes.string
});

export const simpleOrganisationType = PropTypes.shape({
  id: PropTypes.number,
  name: PropTypes.string,
  isDeleted: PropTypes.bool
});

export const iso3166Type = PropTypes.shape({
  iso: PropTypes.string,
  name: PropTypes.string
});

export const documentType = PropTypes.shape({
  id: PropTypes.string,
  type: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  dateInscription: PropTypes.string,
  dateReviewed: PropTypes.string,
  datePublication: PropTypes.string,
  isValidated: PropTypes.bool,
  isDeleted: PropTypes.bool
});

export const fileType = PropTypes.shape({
  dateInscription: PropTypes.string,
  isValidated: PropTypes.bool,
  fileName: PropTypes.string,
  completePath: PropTypes.string
});

export const defaultDocumentValuesTypes = PropTypes.shape({
  id: PropTypes.number,
  identifier: PropTypes.string,
  identifierType: PropTypes.string,
  datePublication: PropTypes.string,
  creatorComment: PropTypes.string,
  authors: PropTypes.arrayOf(simpleCaverType),
  editor: simpleOrganisationType,
  library: simpleOrganisationType,
  type: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  subjects: PropTypes.arrayOf(subjectType),
  pages: PropTypes.string,
  issue: PropTypes.string,
  license: PropTypes.string,
  mainLanguage: PropTypes.string,
  option: PropTypes.string,
  files: PropTypes.arrayOf(fileType),
  parent: documentType,
  authorizationDocument: documentType,
  iso3166: PropTypes.arrayOf(iso3166Type)
});
