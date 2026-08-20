import { useQuery } from '@tanstack/react-query';

import { getCountryUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { countryKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

export const useCountry = countryId =>
  useQuery({
    queryKey: countryKeys.detail(countryId),
    queryFn: () => apiGet(getCountryUrl(countryId)),
    enabled: Boolean(countryId),
    staleTime: STALE.STANDARD
  });

export default useCountry;
