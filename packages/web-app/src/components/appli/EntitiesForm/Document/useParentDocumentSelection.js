import { useContext, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import { documentKeys } from '@/api/queryKeys';
import { getDocumentDetailsUrl } from '@/conf/apiRoutes';
import { STALE } from '@/conf/queryClient';
import { useLanguages, useLicenses, findLicenseByName } from '@/hooks';
import { getLicenseName } from '@/components/common/LicenseTag/helpers';
import { DocumentFormContext } from './Provider';
import { DOCUMENT_AUTHORIZE_TO_PUBLISH } from './formElements/AddFileForm/FileHelpers';

const fetchDocumentDetail = (queryClient, id) =>
  queryClient.fetchQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => apiGet(`${getDocumentDetailsUrl}${id}`),
    staleTime: STALE.STANDARD
  });

// Only an explicit parent selection inherits metadata. Merely displaying an
// existing document's parent must not overwrite its edited fields.
const useParentDocumentSelection = () => {
  const { document, updateAttribute } = useContext(DocumentFormContext);
  const queryClient = useQueryClient();
  const { data: languages = [] } = useLanguages();
  const { data: licenses } = useLicenses();
  const selectionVersionRef = useRef(0);

  useEffect(
    () => () => {
      // Ignore a pending response after unmount or a change of allowed parent type.
      selectionVersionRef.current += 1;
    },
    [document.type]
  );

  return async selection => {
    const version = ++selectionVersionRef.current;
    updateAttribute('parent', selection);
    if (!selection) return;

    try {
      const details = await fetchDocumentDetail(queryClient, selection.id);
      if (version !== selectionVersionRef.current) return;

      if (typeof details.mainLanguage === 'string' && details.mainLanguage) {
        updateAttribute('mainLanguage', details.mainLanguage);
        updateAttribute(
          'mainLanguageName',
          languages.find(language => language.id === details.mainLanguage)
            ?.refName ?? details.mainLanguage
        );
      }
      if (details.license) {
        updateAttribute(
          'license',
          findLicenseByName(licenses, getLicenseName(details.license)) ??
            details.license
        );
      }
      updateAttribute('editor', details.editor ?? null);
      updateAttribute('library', details.library ?? null);
      updateAttribute(
        'selectOptionAuthorizationDocument',
        details.authorizationDocument ? DOCUMENT_AUTHORIZE_TO_PUBLISH : null
      );
      if (details.authorizationDocument) {
        const authorization = await fetchDocumentDetail(
          queryClient,
          details.authorizationDocument.id
        );
        if (version !== selectionVersionRef.current) return;
        updateAttribute('authorizationDocument', authorization);
      } else {
        updateAttribute('authorizationDocument', null);
      }
    } catch (error) {
      if (version === selectionVersionRef.current)
        console.error('Error fetching parent document details:', error);
    }
  };
};

export default useParentDocumentSelection;
