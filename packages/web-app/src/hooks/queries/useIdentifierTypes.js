import { useQuery } from '@tanstack/react-query';

import { identifierTypesUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { referenceKeys } from '../../api/queryKeys';
import { REFERENCE_QUERY } from '../../conf/queryClient';

/** Identifier kinds a document can carry (DOI, ISBN, ISSN, URL, …). */
export const useIdentifierTypes = () =>
  useQuery({
    queryKey: referenceKeys.identifierTypes(),
    queryFn: async () => (await apiGet(identifierTypesUrl)).identifierTypes,
    ...REFERENCE_QUERY
  });

export default useIdentifierTypes;
