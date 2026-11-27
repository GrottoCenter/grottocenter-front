import {
  useState,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef
} from 'react';
import PropTypes from 'prop-types';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import { isPdfPageOffsetValid } from '@/utils/pdfUrl';
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
import useParentDocumentSelection from './useParentDocumentSelection';
import usePhotoDatePrefill from './usePhotoDatePrefill';

export const defaultDocAttributes = {
  id: null,
  identifier: null,
  identifierType: null,
  identifierPdfPageOffset: null,
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

const checkFormValidation = (
  document,
  isNewDocument,
  hasStoredAuthorization
) => {
  let isValid = true;

  const payload = filterDocumentPayload(document);
  if (!isPdfPageOffsetValid(payload.identifierPdfPageOffset)) isValid = false;
  if (
    (payload.files ?? []).some(
      file =>
        file.state !== IS_DELETED && !isPdfPageOffsetValid(file.pdfPageOffset)
    )
  )
    isValid = false;
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
    // Existing and pending details may omit the parent's title. Creation must
    // still resolve URL-only parents before allowing submission.
    (isNewDocument ? !document.parent?.title : !document.parent)
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
  const isCollection = document.type === DocumentTypes.COLLECTION;
  if (
    isCollection &&
    (document.authorizationDocument || hasStoredAuthorization)
  ) {
    if (!document.authorizationDocument?.id || !document.license?.id)
      isValid = false;
    if (
      document.selectOptionAuthorizationDocument !==
      DOCUMENT_AUTHORIZE_TO_PUBLISH
    )
      isValid = false;
  } else if (!isCollection && requiresAuthorization && hasVisibleFile) {
    if (!document.selectOptionAuthorizationDocument) isValid = false;
    // The API expects license[id], not the name returned by document details.
    if (!document.license?.id) isValid = false;
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
  hasStoredAuthorization: false,
  allowEntityCreation: true,
  isFormValid: true,
  lengthErrors: [],
  updateAttribute: (_attributeName, _newValue) => {},
  selectParent: () => {},
  resetContext: () => {},
  linkedEntrance: null,
  setLinkedEntrance: () => {}
});

const getPublicationRights = ({
  license = null,
  authorizationDocument = null,
  selectOptionAuthorizationDocument = null
}) => ({
  license,
  authorizationDocument,
  selectOptionAuthorizationDocument
});

const getCollectionPublicationRights = document => {
  const { authorizationDocument, license } = getPublicationRights(document);
  const hasAuthorization = !!authorizationDocument?.id;
  return {
    license: hasAuthorization ? license : null,
    authorizationDocument,
    selectOptionAuthorizationDocument: hasAuthorization
      ? DOCUMENT_AUTHORIZE_TO_PUBLISH
      : null
  };
};

const normalizeInitialValues = values => {
  if (!values) return {};
  const { option, files, authorsOrganization, ...rest } = values;
  return {
    ...rest,
    parent:
      typeof rest.parent === 'number' || typeof rest.parent === 'string'
        ? { id: rest.parent }
        : (rest.parent ?? null),
    selectOptionAuthorizationDocument:
      option ??
      (values.authorizationDocument?.id ? DOCUMENT_AUTHORIZE_TO_PUBLISH : null),
    files: (files ?? []).map(f => ({ ...f, state: f.state ?? IS_INTACT })),
    authorsOrganization: authorsOrganization ?? []
  };
};

const createFormState = document => {
  const collectionRights = getCollectionPublicationRights(document);
  return {
    document:
      document.type === DocumentTypes.COLLECTION
        ? { ...document, ...collectionRights }
        : document,
    collectionRights,
    preCollectionDraft: null
  };
};

// Restore the original parent and publication choices when undoing a switch
// to Collection. The collection keeps its own draft across type changes.
const changeDocumentType = (state, type) => {
  const { document, collectionRights, preCollectionDraft } = state;
  if (type === DocumentTypes.COLLECTION)
    return {
      ...state,
      preCollectionDraft: {
        ...getPublicationRights(document),
        type: document.type,
        parent: document.parent
      },
      document: { ...document, ...collectionRights, type, parent: null }
    };
  if (document.type === DocumentTypes.COLLECTION)
    return {
      document: {
        ...document,
        ...(preCollectionDraft?.type === type ? preCollectionDraft : {}),
        type
      },
      collectionRights: getCollectionPublicationRights(document),
      preCollectionDraft: null
    };
  return { ...state, document: { ...document, type } };
};

const Provider = ({
  children,
  initialValues,
  creationContext,
  allowEntityCreation = true
}) => {
  const [formState, setFormState] = useState(() =>
    createFormState({
      ...defaultDocAttributes,
      ...(!initialValues && creationContext
        ? { type: creationContext.type }
        : {}),
      ...normalizeInitialValues(initialValues)
    })
  );
  const { document } = formState;
  const setDocument = useCallback(update => {
    setFormState(state => {
      const nextDocument = update(state.document);
      return nextDocument === state.document
        ? state
        : { ...state, document: nextDocument };
    });
  }, []);
  // The multipart API cannot clear a stored publication option.
  const hasStoredAuthorization = !!initialValues?.authorizationDocument?.id;
  const attributeVersionsRef = useRef({});
  const allowPhotoDatePrefillRef = useRef(true);
  usePhotoDatePrefill({
    document,
    setDocument,
    attributeVersionsRef,
    allowPrefillRef: allowPhotoDatePrefillRef
  });
  const selectParent = useParentDocumentSelection({
    document,
    setDocument,
    attributeVersionsRef,
    isNewDocument: !initialValues,
    initialParent: !initialValues ? creationContext?.parent : null
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const [linkedEntrance, setLinkedEntrance] = useState(null);
  const lengthErrors = useMemo(
    () => getDocumentLengthErrors(document),
    [document]
  );

  const updateAttribute = useCallback(
    (attributeName, newValue) => {
      // An explicit date edit (including clearing it) wins over photo metadata
      // for the rest of this document, even if extraction has not finished yet.
      if (attributeName === 'datePublication')
        allowPhotoDatePrefillRef.current = false;
      attributeVersionsRef.current[attributeName] =
        (attributeVersionsRef.current[attributeName] ?? 0) + 1;
      if (attributeName === 'type') {
        setFormState(state =>
          newValue === state.document.type
            ? state
            : changeDocumentType(state, newValue)
        );
        return;
      }
      setDocument(prevState => {
        if (
          attributeName === 'authorizationDocument' &&
          prevState.type === DocumentTypes.COLLECTION
        )
          return {
            ...prevState,
            ...getCollectionPublicationRights({
              ...prevState,
              authorizationDocument: newValue
            })
          };
        return { ...prevState, [attributeName]: newValue };
      });
    },
    [setDocument]
  );

  useEffect(() => {
    setIsFormValid(
      checkFormValidation(document, !initialValues, hasStoredAuthorization)
    );
  }, [document, initialValues, hasStoredAuthorization, setIsFormValid]);

  const resetContext = useCallback((overrides = {}) => {
    allowPhotoDatePrefillRef.current = true;
    attributeVersionsRef.current.datePublication =
      (attributeVersionsRef.current.datePublication ?? 0) + 1;
    attributeVersionsRef.current.parent =
      (attributeVersionsRef.current.parent ?? 0) + 1;
    setFormState(createFormState({ ...defaultDocAttributes, ...overrides }));
  }, []);

  const contextValue = useMemo(
    () => ({
      document,
      isNewDocument: !initialValues,
      hasStoredAuthorization,
      allowEntityCreation,
      isFormValid,
      lengthErrors,
      updateAttribute,
      selectParent,
      resetContext,
      linkedEntrance,
      setLinkedEntrance
    }),
    [
      document,
      initialValues,
      hasStoredAuthorization,
      allowEntityCreation,
      isFormValid,
      lengthErrors,
      updateAttribute,
      selectParent,
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
  initialValues: defaultDocumentValuesTypes,
  creationContext: PropTypes.shape({
    type: PropTypes.oneOf([DocumentTypes.ARTICLE, DocumentTypes.ISSUE])
      .isRequired,
    parent: PropTypes.shape({ id: PropTypes.number.isRequired }).isRequired
  }),
  allowEntityCreation: PropTypes.bool
};

export default Provider;
