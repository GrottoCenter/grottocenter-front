import { useQuery } from '@tanstack/react-query';

import {
  cumulatedLengthUrl,
  dynamicNumbersUrl,
  getStatisticsCountryUrl,
  getStatisticsMassifUrl,
  getStatisticsRegionUrl
} from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { statsKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

// Homepage counters. The legacy endpoint returned the count as a *stringified*
// JSON body ({"count": 42} rendered as text and JSON.parsed again by the
// reducer); apiGet already parses, so extracting .count here matches the
// shape consumers use (number, not object).
export const useDynamicNumber = numberType => {
  const url = dynamicNumbersUrl[numberType];
  return useQuery({
    queryKey: statsKeys.dynamicNumber(numberType),
    queryFn: async () => {
      const data = await apiGet(url);
      return data?.count ?? null;
    },
    enabled: Boolean(url),
    staleTime: STALE.STANDARD
  });
};

// Aggregate cave length, shown on the homepage. Long TTL — the value is a
// slow-moving global stat.
export const useCumulatedLength = () =>
  useQuery({
    queryKey: statsKeys.cumulatedLength(),
    queryFn: () => apiGet(cumulatedLengthUrl),
    staleTime: STALE.STANDARD
  });

// Per-country statistics block for the StatisticsDataDashboard.
export const useStatisticsCountry = countryId =>
  useQuery({
    queryKey: statsKeys.country(countryId),
    queryFn: () => apiGet(getStatisticsCountryUrl(countryId)),
    enabled: Boolean(countryId),
    staleTime: STALE.STANDARD
  });

// Per-region statistics block. Composite key: two countries can share a short
// regionId, mirroring regionKeys.detail.
export const useStatisticsRegion = (countryId, regionId) =>
  useQuery({
    queryKey: statsKeys.region(countryId, regionId),
    queryFn: () => apiGet(getStatisticsRegionUrl(countryId, regionId)),
    enabled: Boolean(countryId && regionId),
    staleTime: STALE.STANDARD
  });

// Per-massif statistics block.
export const useStatisticsMassif = massifId =>
  useQuery({
    queryKey: statsKeys.massif(massifId),
    queryFn: () => apiGet(getStatisticsMassifUrl(massifId)),
    enabled: Boolean(massifId),
    staleTime: STALE.STANDARD
  });
