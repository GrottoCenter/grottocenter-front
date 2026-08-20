import { useQuery } from '@tanstack/react-query';

import { getDocumentsUrl } from '../../conf/apiRoutes';
import { apiGetWithRange } from '../../api/client';
import { documentKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';
import { getTotalCount, makeUrl } from '../../actions/utils';

const selectList = ({ data, contentRange }) => {
  const documents = data?.documents ?? [];
  return {
    documents,
    totalCount: getTotalCount(documents.length, contentRange)
  };
};

/**
 * Paginated documents list. Used by the moderator validation queue and by the
 * AddFileForm to fetch the "Authorization To Publish" documents. The criteria
 * shape (isValidated, documentType, limit, skip) matches the legacy thunk so
 * the API call is identical.
 */
export const useDocuments = (criteria = {}, { enabled = true } = {}) =>
  useQuery({
    queryKey: documentKeys.list(criteria),
    queryFn: () => apiGetWithRange(makeUrl(getDocumentsUrl, criteria)),
    select: selectList,
    enabled,
    staleTime: STALE.VOLATILE
  });

export default useDocuments;
