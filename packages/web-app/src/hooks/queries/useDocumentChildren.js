import { useQuery } from '@tanstack/react-query';

import { getDocumentChildrenUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { documentKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

const EMPTY = [];

/**
 * Children of a document (issues, articles, other attached documents).
 *
 * `select` returns the array directly so callers destructure `children` from
 * the query result without an extra `?.documents` step. The raw payload
 * shape is `{ documents: [...] }` — kept in cache untransformed so a future
 * caller that needs the wrapping can still read it via a different select.
 */
export const useDocumentChildren = documentId =>
  useQuery({
    queryKey: documentKeys.children(documentId),
    queryFn: () => apiGet(getDocumentChildrenUrl(documentId)),
    select: data => data?.documents ?? EMPTY,
    enabled: Boolean(documentId),
    staleTime: STALE.STANDARD
  });

export default useDocumentChildren;
