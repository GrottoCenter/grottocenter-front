import { useQuery } from '@tanstack/react-query';

import { getDocumentDetailsUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { documentKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

/**
 * The full detail payload of a document.
 *
 * `requireUpdate` asks the API for the snapshot version a moderator can act
 * on — same document id, different payload. It has to be part of the query
 * key so the two shapes never overwrite each other in cache.
 *
 * @param {number|string} documentId
 * @param {{ requireUpdate?: boolean }} [options]
 */
export const useDocument = (documentId, { requireUpdate } = {}) =>
  useQuery({
    queryKey: documentKeys.detail(documentId, requireUpdate),
    queryFn: () => {
      const suffix = requireUpdate ? `?requireUpdate=${requireUpdate}` : '';
      return apiGet(`${getDocumentDetailsUrl}${documentId}${suffix}`);
    },
    enabled: Boolean(documentId),
    staleTime: STALE.STANDARD
  });

export default useDocument;
