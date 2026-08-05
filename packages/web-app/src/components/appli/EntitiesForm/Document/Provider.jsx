import {
  useState,
  createContext,
  useCallback,
  useEffect,
  useMemo
} from 'react';
import PropTypes from 'prop-types';
import { DocumentTypes } from '../../../../utils/documentTypeHelpers';
import {
  IS_INTACT,
  IS_DELETED,
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

const checkFormValidation = document => {
  let isValid = true;

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

  if (document.authors.length + document.authorsOrganization.length === 0)
    isValid = false;
  if (!isDocumentPagesFormatValid(document.pages)) isValid = false;
  if (document.identifier && !document.identifierType) isValid = false;
  if (isValid && document.identifierType?.regexp)
    isValid = new RegExp(document.identifierType?.regexp).test(
      document.identifier
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
    files: (files ?? []).map(f => ({ ...f, state: IS_INTACT })),
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
      updateAttribute,
      resetContext,
      linkedEntrance,
      setLinkedEntrance
    }),
    [
      document,
      initialValues,
      isFormValid,
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
