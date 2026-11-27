import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import { documentKeys } from '@/api/queryKeys';
import { getDocumentDetailsUrl } from '@/conf/apiRoutes';
import { STALE } from '@/conf/queryClient';
import { useLanguages, useLicenses, findLicenseByName } from '@/hooks';
import { getLicenseName } from '@/components/common/LicenseTag/helpers';
import {
  DocumentTypes,
  getParentDocumentType
} from '@/utils/documentTypeHelpers';
import { DOCUMENT_AUTHORIZE_TO_PUBLISH } from './formElements/AddFileForm/FileHelpers';

const fetchDocumentDetail = (queryClient, id) =>
  queryClient.fetchQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => apiGet(`${getDocumentDetailsUrl}${id}`),
    staleTime: STALE.STANDARD
  });

// Only an explicit parent selection inherits metadata. Merely displaying an
// existing document's parent must not overwrite its edited fields.
const useParentDocumentSelection = ({
  document,
  setDocument,
  attributeVersionsRef,
  isNewDocument,
  initialParent
}) => {
  const queryClient = useQueryClient();
  const { data: languages, refetch: fetchLanguages } = useLanguages();
  const { data: licenses, refetch: fetchLicenses } = useLicenses();
  const selectionVersionRef = useRef(0);
  const { type } = document;
  const isMountedRef = useRef(false);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const selectParent = useCallback(
    async selection => {
      const version = ++selectionVersionRef.current;
      const attributeVersions = { ...attributeVersionsRef.current };
      // Only replace an empty title or the untouched collection-name prefill.
      // A contributor's issue suffix or custom title belongs to them.
      const shouldPrefillTitle =
        isNewDocument &&
        type === DocumentTypes.ISSUE &&
        (!document.title || document.title === document.parent?.title);
      setDocument(current => ({
        ...current,
        parent: selection,
        ...(!selection && shouldPrefillTitle ? { title: '' } : {}),
        ...current.inheritedPublicationRights?.previous,
        inheritedPublicationRights: null,
        isParentPending: !!selection
      }));
      if (!selection) return;

      const isCurrent = () =>
        isMountedRef.current &&
        version === selectionVersionRef.current &&
        attributeVersions.type === attributeVersionsRef.current.type &&
        attributeVersions.parent === attributeVersionsRef.current.parent;
      // A late inheritance response must not overwrite fields edited meanwhile.
      const applyAttributes = attributes => {
        setDocument(current => {
          if (
            !isCurrent() ||
            current.type !== type ||
            current.parent?.id !== selection.id
          )
            return current;
          const unchanged = Object.fromEntries(
            Object.entries(attributes).filter(
              ([field]) =>
                attributeVersions[field] === attributeVersionsRef.current[field]
            )
          );
          return { ...current, ...unchanged };
        });
      };

      try {
        const [details, languageResult, licenseResult] = await Promise.all([
          fetchDocumentDetail(queryClient, selection.id),
          languages ? { data: languages } : fetchLanguages(),
          licenses ? { data: licenses } : fetchLicenses()
        ]);
        if (!isCurrent()) return;

        const expectedParentType = getParentDocumentType(type);
        if (
          details.isDeleted ||
          (expectedParentType && details.type !== expectedParentType)
        ) {
          applyAttributes({ parent: null });
          return;
        }

        const attributes = {
          parent: { ...selection, title: details.title, type: details.type }
        };
        if (shouldPrefillTitle && details.title)
          attributes.title = details.title;
        // Contextual links may only supply an ID. Resolve the selector's label
        // through the same detail request used for inheritance.
        if (
          isNewDocument &&
          typeof details.mainLanguage === 'string' &&
          details.mainLanguage
        ) {
          attributes.mainLanguage = details.mainLanguage;
          attributes.mainLanguageName =
            languageResult.data?.find(
              language => language.id === details.mainLanguage
            )?.refName ?? details.mainLanguage;
        }
        if (isNewDocument) {
          attributes.editor = details.editor ?? null;
          attributes.library = details.library ?? null;
        }
        applyAttributes(attributes);

        const authorizationId = details.authorizationDocument?.id;
        const license = findLicenseByName(
          licenseResult.data,
          getLicenseName(details.license)
        );
        // The API stores the result of copying rights, without provenance.
        // Only lock rights copied from a verified parent in this session.
        if (
          !isNewDocument ||
          !authorizationId ||
          !license?.id ||
          details.option !== DOCUMENT_AUTHORIZE_TO_PUBLISH
        )
          return;

        const authorization = await fetchDocumentDetail(
          queryClient,
          authorizationId
        );
        if (
          !isCurrent() ||
          authorization.isDeleted ||
          authorization.isValidated === false ||
          authorization.type !== DocumentTypes.AUTHORIZATION_TO_PUBLISH
        )
          return;

        setDocument(current => {
          if (
            !isCurrent() ||
            current.type !== type ||
            current.parent?.id !== selection.id ||
            [
              'license',
              'authorizationDocument',
              'selectOptionAuthorizationDocument'
            ].some(
              field =>
                attributeVersions[field] !== attributeVersionsRef.current[field]
            )
          )
            return current;
          return {
            ...current,
            license,
            authorizationDocument: authorization,
            selectOptionAuthorizationDocument: DOCUMENT_AUTHORIZE_TO_PUBLISH,
            inheritedPublicationRights: {
              previous: {
                license: current.license,
                authorizationDocument: current.authorizationDocument,
                selectOptionAuthorizationDocument:
                  current.selectOptionAuthorizationDocument
              }
            }
          };
        });
      } catch (error) {
        if (!isCurrent()) return;
        console.error('Error fetching parent document details:', error);
        if (!selection.title) applyAttributes({ parent: null });
      } finally {
        if (isCurrent()) {
          setDocument(current =>
            current.type === type
              ? { ...current, isParentPending: false }
              : current
          );
        }
      }
    },
    [
      type,
      isNewDocument,
      document.title,
      document.parent?.title,
      setDocument,
      attributeVersionsRef,
      queryClient,
      languages,
      licenses,
      fetchLanguages,
      fetchLicenses
    ]
  );

  useEffect(() => {
    if (!initialParent || isInitializedRef.current) return;
    isInitializedRef.current = true;
    selectParent(initialParent);
  }, [initialParent, selectParent]);

  return selectParent;
};

export default useParentDocumentSelection;
