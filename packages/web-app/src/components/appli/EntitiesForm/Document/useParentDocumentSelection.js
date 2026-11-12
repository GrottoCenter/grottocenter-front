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
  const previousTypeRef = useRef(document.type);
  const { type } = document;
  const isMountedRef = useRef(false);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (previousTypeRef.current !== document.type) {
      selectionVersionRef.current += 1;
      previousTypeRef.current = document.type;
    }
  }, [document.type]);

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
        authorizationDocument:
          current.parent?.id === selection?.id
            ? current.authorizationDocument
            : null
      }));
      if (!selection) return;

      const isCurrent = () =>
        isMountedRef.current &&
        version === selectionVersionRef.current &&
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

      let hasResolvedParent = false;
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
        hasResolvedParent = true;

        const attributes = {
          parent: { ...selection, title: details.title, type: details.type }
        };
        if (shouldPrefillTitle && details.title)
          attributes.title = details.title;
        // Contextual links may only supply an ID. Resolve the selector's label
        // through the same detail request used for inheritance.
        if (typeof details.mainLanguage === 'string' && details.mainLanguage) {
          attributes.mainLanguage = details.mainLanguage;
          attributes.mainLanguageName =
            languageResult.data?.find(
              language => language.id === details.mainLanguage
            )?.refName ?? details.mainLanguage;
        }
        if (details.license) {
          attributes.license =
            findLicenseByName(
              licenseResult.data,
              getLicenseName(details.license)
            ) ?? details.license;
        }
        attributes.editor = details.editor ?? null;
        attributes.library = details.library ?? null;
        attributes.selectOptionAuthorizationDocument =
          details.authorizationDocument ? DOCUMENT_AUTHORIZE_TO_PUBLISH : null;
        applyAttributes(attributes);
        if (details.authorizationDocument) {
          const authorization = await fetchDocumentDetail(
            queryClient,
            details.authorizationDocument.id
          );
          if (!isCurrent()) return;
          applyAttributes({ authorizationDocument: authorization });
        } else {
          applyAttributes({ authorizationDocument: null });
        }
      } catch (error) {
        if (!isCurrent()) return;
        console.error('Error fetching parent document details:', error);
        // Preserve a visible selection, including a resolved parent whose
        // authorization request failed, but never keep an invisible URL ID.
        if (!hasResolvedParent && !selection.title)
          applyAttributes({ parent: null });
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
