import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/api/client';
import { pointKeys } from '@/api/queryKeys';
import {
  pointsUrl,
  pointUrl,
  getMapPointsCoordinatesUrl
} from '@/conf/apiRoutes';
import { STALE } from '@/conf/queryClient';
import { selectSurfacePointCoordinates } from '@/utils/points';

const PAGE_SIZE = 100;

const fetchPoints = async () => {
  // Deliberate first-version tradeoff: there are very few points, so load ALL
  // API pages and search the complete list in the browser. This is not server
  // search: replace it with server-side filtering/pagination as the list grows.
  // The API caps size at 100; one oversized request would truncate the list.
  const first = await apiGet(`${pointsUrl}?page=1&size=${PAGE_SIZE}`);
  const pageCount = Math.ceil(first.total / PAGE_SIZE);
  const remaining = await Promise.all(
    Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
      apiGet(`${pointsUrl}?page=${index + 2}&size=${PAGE_SIZE}`)
    )
  );
  return [first, ...remaining].flatMap(result => result.points);
};

export const usePoints = () =>
  useQuery({
    queryKey: pointKeys.list(),
    queryFn: fetchPoints,
    staleTime: STALE.VOLATILE
  });

export const usePoint = id =>
  useQuery({
    queryKey: pointKeys.detail(id),
    queryFn: () => apiGet(pointUrl(id)),
    enabled: id != null && id !== '',
    staleTime: STALE.STANDARD
  });

export const useSurfacePointCoordinates = ({ enabled }) =>
  useQuery({
    queryKey: pointKeys.coordinates(),
    queryFn: ({ signal }) =>
      apiGet(`${getMapPointsCoordinatesUrl}?underground=false`, { signal }),
    select: selectSurfacePointCoordinates,
    enabled,
    staleTime: STALE.VOLATILE
  });
