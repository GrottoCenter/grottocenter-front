import { useState, createContext, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import { isDocumentDateValid } from '@/utils/documentDate';
import { isPdfPageOffsetValid } from '@/utils/pdfUrl';
import {
  DocumentTypes,
  filterDocumentPayload,
  getDocumentTypeRules,
  isDocumentSelfParent
} from '@/utils/documentTypeHelpers';
import {
  IS_INTACT,
  IS_DELETED,
  IS_NEW,
  AUTHORIZATION_FROM_AUTHOR,
  LICENSE_IN_FILE,
  DOCUMENT_AUTHORIZE_TO_PUBLISH
} from './formElements/AddFileForm/FileHelpers';
import { defaultDocumentValuesTypes } from './types';
import useGrantedPublicationLicense from './useGrantedPublicationLicense';
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
  type: DocumentTypes.UNKNOWN,
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

const hasAuthors = document =>
  document.authors.length > 0 || document.authorsOrganization.length > 0;

export const getIncompatibleFiles = document => {
  const { allowsFiles, accept } = getDocumentTypeRules(document.type);
  return document.files.filter(file => {
    if (file.state === IS_DELETED) return false;
    if (!allowsFiles) return true;
    if (file.state !== IS_NEW || !accept) return false;
    const extension = (file.fileName ?? file.file?.name)?.split('.').at(-1);
    return !accept.extensions.includes(extension?.toLowerCase());
  });
};

const sharingOptions = [
  AUTHORIZATION_FROM_AUTHOR,
  LICENSE_IN_FILE,
  DOCUMENT_AUTHORIZE_TO_PUBLISH
];

const getBlockingField = (
  document,
  { isNewDocument, hasStoredAuthorization, initialType, lengthErrors }
) => {
  const rules = getDocumentTypeRules(document.type);
  const payload = filterDocumentPayload(document);
  if (!rules.hasType) return 'type';
  if (!document.title?.trim()) return 'title';
  if (rules.requiresDate && !document.datePublication) return 'date';
  if (
    rules.hasDate &&
    !isDocumentDateValid(document.datePublication, rules.requiresDate)
  )
    return 'date';
  if (
    rules.parentType &&
    (!document.parent?.id ||
      (isNewDocument && !document.parent.title) ||
      (document.parent.type && document.parent.type !== rules.parentType) ||
      isDocumentSelfParent(document))
  )
    return 'parent';
  if (document.isParentPending) return 'parent';
  if (rules.requiresAuthor && !hasAuthors(document)) return 'authors';
  if (lengthErrors.length > 0) return lengthErrors[0].field;
  if (!isDocumentPagesFormatValid(payload.pages)) return 'pages';
  if (payload.identifier && !payload.identifierType) return 'identifier';
  if (
    payload.identifierType?.regexp &&
    !new RegExp(payload.identifierType.regexp).test(payload.identifier)
  )
    return 'identifier';
  if (!isPdfPageOffsetValid(payload.identifierPdfPageOffset))
    return 'identifier';
  if (getIncompatibleFiles(document).length > 0) return 'files';
  if (
    rules.allowsFiles &&
    document.files.some(
      file =>
        (file.state !== IS_DELETED &&
          !isPdfPageOffsetValid(file.pdfPageOffset)) ||
        (file.state === IS_NEW &&
          Math.max(file.fileName?.length ?? 0, file.file?.name?.length ?? 0) >
            TEXT_LENGTH_LIMITS.FILE_NAME)
    )
  )
    return 'files';

  const hasFiles =
    rules.allowsFiles && document.files.some(file => file.state !== IS_DELETED);
  const option = document.selectOptionAuthorizationDocument;
  const hasAuthorization = !!document.authorizationDocument?.id;
  if (
    hasStoredAuthorization &&
    document.type !== initialType &&
    !rules.hasCollectionSharing &&
    !rules.hasFileSharing
  )
    return 'type';
  if (rules.hasCollectionSharing) {
    if (!(hasStoredAuthorization || document.authorizationDocument))
      return null;
    return hasAuthorization &&
      document.license?.id &&
      option === DOCUMENT_AUTHORIZE_TO_PUBLISH
      ? null
      : 'authorization';
  }
  if (rules.hasGrantedLicense) return document.license?.id ? null : 'license';
  if (rules.hasFileSharing && (hasAuthorization || hasStoredAuthorization)) {
    return hasAuthorization && document.license?.id ? null : 'authorization';
  }
  if (!rules.hasFileSharing || !hasFiles) return null;
  if (!sharingOptions.includes(option)) return 'sharing';
  if (option === DOCUMENT_AUTHORIZE_TO_PUBLISH) return 'authorization';
  return document.license?.id ? null : 'license';
};

export const DocumentFormContext = createContext({
  document: defaultDocAttributes,
  isNewDocument: true,
  hasStoredAuthorization: false,
  grantedPublicationLicense: null,
  initialType: null,
  allowEntityCreation: true,
  isFormValid: true,
  blockingField: null,
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
  const { option, files, authors, authorsOrganization, ...rest } = values;
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
    authors: authors ?? [],
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
const changeDocumentType = (state, type, isNewDocument) => {
  const { document, collectionRights, preCollectionDraft } = state;
  const keepParent =
    getDocumentTypeRules(document.type).parentType ===
    getDocumentTypeRules(type).parentType;
  const hasPrefilledTitle =
    isNewDocument &&
    document.type === DocumentTypes.ISSUE &&
    !!document.title &&
    document.title === document.parent?.title;
  if (type === DocumentTypes.COLLECTION) {
    return {
      ...state,
      preCollectionDraft: {
        ...getPublicationRights(document),
        type: document.type,
        parent: document.isParentPending ? null : document.parent,
        inheritedPublicationRights: document.inheritedPublicationRights,
        ...(hasPrefilledTitle && { title: document.title })
      },
      document: {
        ...document,
        ...collectionRights,
        inheritedPublicationRights: null,
        isParentPending: false,
        type,
        parent: null,
        ...(hasPrefilledTitle && { title: '' })
      }
    };
  }
  if (document.type === DocumentTypes.COLLECTION) {
    const draft = preCollectionDraft?.type === type ? preCollectionDraft : null;
    return {
      ...state,
      document: {
        ...document,
        ...getPublicationRights(draft ?? {}),
        inheritedPublicationRights: null,
        ...draft,
        isParentPending: false,
        type,
        title: document.title || draft?.title || ''
      },
      collectionRights: getCollectionPublicationRights(document),
      preCollectionDraft: null
    };
  }
  return {
    ...state,
    document: {
      ...document,
      ...(keepParent
        ? {}
        : {
            ...document.inheritedPublicationRights?.previous,
            parent: null,
            ...(hasPrefilledTitle && { title: '' }),
            isParentPending: false,
            inheritedPublicationRights: null
          }),
      type
    }
  };
};

const Provider = ({
  children,
  initialValues,
  persistedDocument,
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
  const { document: draft } = formState;
  const rules = getDocumentTypeRules(draft.type);
  const authorizationId =
    rules.hasFileSharing || rules.hasCollectionSharing
      ? draft.authorizationDocument?.id
      : undefined;
  const grantedPublicationLicense =
    useGrantedPublicationLicense(authorizationId);
  const document = useMemo(
    () =>
      authorizationId
        ? {
            ...draft,
            license: grantedPublicationLicense.license ?? null,
            selectOptionAuthorizationDocument: DOCUMENT_AUTHORIZE_TO_PUBLISH
          }
        : draft,
    [authorizationId, draft, grantedPublicationLicense.license]
  );
  const setDocument = useCallback(update => {
    setFormState(state => {
      const nextDocument = update(state.document);
      return nextDocument === state.document
        ? state
        : { ...state, document: nextDocument };
    });
  }, []);
  // The multipart API cannot clear a stored publication option.
  const hasStoredAuthorization = !!(persistedDocument ?? initialValues)
    ?.authorizationDocument?.id;
  const initialType = (persistedDocument ?? initialValues)?.type ?? null;
  const isNewDocument = !initialValues;
  const storedLicense = initialValues?.license ?? persistedDocument?.license;
  const attributeVersionsRef = useRef({});
  const allowPhotoDatePrefillRef = useRef(true);
  usePhotoDatePrefill({
    document: draft,
    setDocument,
    attributeVersionsRef,
    allowPrefillRef: allowPhotoDatePrefillRef
  });
  const selectParent = useParentDocumentSelection({
    document: draft,
    setDocument,
    attributeVersionsRef,
    isNewDocument,
    initialParent: isNewDocument ? creationContext?.parent : null
  });

  const lengthErrors = useMemo(
    () => getDocumentLengthErrors(document),
    [document]
  );
  const blockingField = getBlockingField(document, {
    isNewDocument,
    hasStoredAuthorization,
    initialType,
    lengthErrors
  });
  const isFormValid = !blockingField;
  const [linkedEntrance, setLinkedEntrance] = useState(null);

  const updateAttribute = useCallback(
    (attributeName, newValue) => {
      // An explicit date edit (including clearing it) wins over photo metadata
      // for the rest of this document, even if extraction has not finished yet.
      if (attributeName === 'datePublication')
        allowPhotoDatePrefillRef.current = false;
      attributeVersionsRef.current[attributeName] =
        (attributeVersionsRef.current[attributeName] ?? 0) + 1;
      setFormState(state => {
        const current = state.document;
        if (attributeName === 'type') {
          if (newValue === current.type) return state;
          const next = changeDocumentType(state, newValue, isNewDocument);
          if (
            getDocumentTypeRules(newValue).hasGrantedLicense ||
            (getDocumentTypeRules(current.type).hasGrantedLicense &&
              !getDocumentTypeRules(newValue).hasCollectionSharing)
          ) {
            return {
              ...next,
              document: { ...next.document, ...getPublicationRights({}) }
            };
          }
          return next;
        }

        const updatesCollectionAuthorization =
          attributeName === 'authorizationDocument' &&
          current.type === DocumentTypes.COLLECTION;
        const nextDocument = { ...current, [attributeName]: newValue };
        if (
          attributeName === 'authorizationDocument' &&
          newValue?.id !== current.authorizationDocument?.id
        ) {
          nextDocument.inheritedPublicationRights = null;
        }
        return {
          ...state,
          document: updatesCollectionAuthorization
            ? {
                ...nextDocument,
                ...getCollectionPublicationRights(nextDocument)
              }
            : nextDocument
        };
      });
    },
    [isNewDocument]
  );

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
      isNewDocument,
      hasStoredAuthorization,
      grantedPublicationLicense,
      initialType,
      storedLicense,
      allowEntityCreation,
      isFormValid,
      blockingField,
      lengthErrors,
      updateAttribute,
      selectParent,
      resetContext,
      linkedEntrance,
      setLinkedEntrance
    }),
    [
      document,
      isNewDocument,
      hasStoredAuthorization,
      grantedPublicationLicense,
      initialType,
      storedLicense,
      allowEntityCreation,
      isFormValid,
      blockingField,
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
  persistedDocument: defaultDocumentValuesTypes,
  creationContext: PropTypes.shape({
    type: PropTypes.oneOf([DocumentTypes.ARTICLE, DocumentTypes.ISSUE])
      .isRequired,
    parent: PropTypes.shape({ id: PropTypes.number.isRequired }).isRequired
  }),
  allowEntityCreation: PropTypes.bool
};

export default Provider;
