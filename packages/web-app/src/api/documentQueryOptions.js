import { getDocumentDetailsUrl } from '@/conf/apiRoutes';
import { STALE } from '@/conf/queryClient';
import { apiGet } from './client';
import { documentKeys } from './queryKeys';

export const documentQueryOptions = (documentId, { requireUpdate } = {}) => ({
  queryKey: documentKeys.detail(documentId, requireUpdate || undefined),
  queryFn: () => {
    const suffix = requireUpdate ? `?requireUpdate=${requireUpdate}` : '';
    return apiGet(`${getDocumentDetailsUrl}${documentId}${suffix}`);
  },
  enabled: Boolean(documentId),
  staleTime: STALE.STANDARD
});
