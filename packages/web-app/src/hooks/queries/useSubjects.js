import { useQuery } from '@tanstack/react-query';

import { subjectsUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { referenceKeys } from '../../api/queryKeys';
import { REFERENCE_QUERY } from '../../conf/queryClient';

/** The document subject taxonomy. */
export const useSubjects = () =>
  useQuery({
    queryKey: referenceKeys.subjects(),
    queryFn: async () => (await apiGet(subjectsUrl)).subjects,
    ...REFERENCE_QUERY
  });

export default useSubjects;
