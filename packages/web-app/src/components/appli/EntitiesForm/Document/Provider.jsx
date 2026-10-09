import {
  useState,
  createContext,
  useCallback,
  useEffect,
  useMemo
} from 'react';
import PropTypes from 'prop-types';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import {
  DocumentTypes,
  filterDocumentPayload,
  isDocumentSelfParent
} from '../../../../utils/documentTypeHelpers';
import {
  IS_INTACT,
  IS_DELETED,
  IS_NEW,
  DOCUMENT_AUTHORIZE_TO_PUBLISH
} from './formElements/AddFileForm/FileHelpers';
import { defaultDocumentValuesTypes } from './types';

export const defaultDocAttributes = {
  id: null,
  identifier: null,
  identifierType: null,
  datePublication: '',
  creatorComment: '',
  authors: [],
  authorsOrganization: [],
  editor: null,
  library: null,
  type: -1,
  title: '',
  description: '',
  subjects: [],
  pages: null,
  issue: '',
  license: null,
  mainLanguage: '000',
  mainLanguageName: '',
  iso3166: [],
  parent: null,
  files: [],
  authorizationDocument: null,
  selectOptionAuthorizationDocument: null
};

export function isDocumentPagesFormatValid(pages) {
  if (!pages || !pages.includes('-')) return true;
  if (pages.endsWith('-')) return false;

  const [start, end] = pages.split('-').map(e => parseInt(e, 10));
  if (start > 0 && end > 0 && end > start) return true;
  return false;
}

const DESCRIPTION_OPTIONAL_TYPES = [
  DocumentTypes.IMAGE,
  DocumentTypes.TOPOGRAPHIC_DRAWING,
  DocumentTypes.EVENT,
  DocumentTypes.AUTHORIZATION_TO_PUBLISH
];

export const getDocumentLengthErrors = document => {
  const payload = filterDocumentPayload(document);
  return [
    ['title', 'Title', TEXT_LENGTH_LIMITS.TITLE],
    ['identifier', 'Identifier', TEXT_LENGTH_LIMITS.DOCUMENT_IDENTIFIER],
    ['pages', 'Pages', TEXT_LENGTH_LIMITS.DOCUMENT_PAGES],
    ['issue', 'Periodical issue', TEXT_LENGTH_LIMITS.DOCUMENT_ISSUE],
    ['creatorComment', 'Comment', TEXT_LENGTH_LIMITS.DOCUMENT_COMMENT]
  ]
    .filter(([field, , limit]) => (payload[field]?.length ?? 0) > limit)
    .map(([field, label, limit]) => ({
      field,
      label,
      limit,
      count: payload[field].length
    }));
};

const checkFormValidation = document => {
  let isValid = true;

  const payload = filterDocumentPayload(document);
  if (getDocumentLengthErrors(document).length > 0) isValid = false;
  if (
    document.files.some(
      file =>
        file.state === IS_NEW &&
        Math.max(file.fileName?.length ?? 0, file.file?.name?.length ?? 0) >
          TEXT_LENGTH_LIMITS.FILE_NAME
    )
  )
    isValid = false;

  if (!document.title) isValid = false;
  if (
    !DESCRIPTION_OPTIONAL_TYPES.includes(document.type) &&
    !document.description
  )
    isValid = false;
  if (document.type === DocumentTypes.EVENT && !document.datePublication)
    isValid = false;
  if (
    (document.type === DocumentTypes.ISSUE ||
      document.type === DocumentTypes.ARTICLE) &&
    !document.parent
  )
    isValid = false;

  if (
    (document.type === DocumentTypes.ISSUE ||
      document.type === DocumentTypes.ARTICLE) &&
    isDocumentSelfParent(document)
  )
    isValid = false;

  if (document.authors.length + document.authorsOrganization.length === 0)
    isValid = false;
  if (!isDocumentPagesFormatValid(payload.pages)) isValid = false;
  if (payload.identifier && !payload.identifierType) isValid = false;
  if (isValid && payload.identifierType?.regexp)
    isValid = new RegExp(payload.identifierType.regexp).test(
      payload.identifier
    );
  // Files flagged as deleted still remain in the array but are no longer
  // visible, so the licensing/authorization fields are only required when at
  // least one file is actually kept.
  const hasVisibleFile = document.files.some(f => f.state !== IS_DELETED);
  const requiresAuthorization =
    document.type !== DocumentTypes.AUTHORIZATION_TO_PUBLISH;
  if (requiresAuthorization && hasVisibleFile) {
    if (!document.selectOptionAuthorizationDocument) isValid = false;
    if (!document.license) isValid = false;
    if (
      document.selectOptionAuthorizationDocument ===
        DOCUMENT_AUTHORIZE_TO_PUBLISH &&
      !document.authorizationDocument
    )
      isValid = false;
  }

  return !!isValid;
};

export const DocumentFormContext = createContext({
  document: defaultDocAttributes,
  isNewDocument: true,
  isFormValid: true,
  lengthErrors: [],
  updateAttribute: (attributeName, newValue) => {}, // eslint-disable-line no-unused-vars
  resetContext: () => {},
  linkedEntrance: null,
  setLinkedEntrance: () => {}
});

const normalizeInitialValues = values => {
  if (!values) return {};
  const { option, files, authorsOrganization, ...rest } = values;
  return {
    ...rest,
    selectOptionAuthorizationDocument: option ?? null,
    files: (files ?? []).map(f => ({ ...f, state: f.state ?? IS_INTACT })),
    authorsOrganization: authorsOrganization ?? []
  };
};

const Provider = ({ children, initialValues }) => {
  const [document, setDocument] = useState({
    ...defaultDocAttributes,
    ...normalizeInitialValues(initialValues)
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const [linkedEntrance, setLinkedEntrance] = useState(null);
  const lengthErrors = useMemo(
    () => getDocumentLengthErrors(document),
    [document]
  );

  const updateAttribute = useCallback(
    (attributeName, newValue) => {
      setDocument(prevState => ({
        ...prevState,
        [attributeName]: newValue
      }));
    },
    [setDocument]
  );

  useEffect(() => {
    setIsFormValid(checkFormValidation(document));
  }, [document, setIsFormValid]);

  const resetContext = useCallback(
    (overrides = {}) => {
      setDocument({ ...defaultDocAttributes, ...overrides });
    },
    [setDocument]
  );

  const contextValue = useMemo(
    () => ({
      document,
      isNewDocument: !initialValues,
      isFormValid,
      lengthErrors,
      updateAttribute,
      resetContext,
      linkedEntrance,
      setLinkedEntrance
    }),
    [
      document,
      initialValues,
      isFormValid,
      lengthErrors,
      updateAttribute,
      resetContext,
      linkedEntrance
    ]
  );

  return (
    <DocumentFormContext.Provider value={contextValue}>
      {children}
    </DocumentFormContext.Provider>
  );
};

Provider.propTypes = {
  children: PropTypes.node.isRequired,
  initialValues: defaultDocumentValuesTypes
};

export default Provider;
