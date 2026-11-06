import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/api/client';
import { pointKeys } from '@/api/queryKeys';
import {
  pointsUrl,
  pointUrl,
  pointPositionsUrl,
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

const fetchAssociatedPoints = async ({
  entranceId,
  networkId,
  legacyCaveId,
  page,
  size
}) => {
  const filter = networkId != null ? 'networkId' : 'entranceId';
  const id = networkId ?? entranceId;
  const pagination = `page=${page}&size=${size}`;
  const result = await apiGet(
    `${pointsUrl}?${filter}=${encodeURIComponent(id)}&${pagination}`
  );

  // TEMPORARY https://github.com/GrottoCenter/grottocenter-api/issues/1978:
  // DELETE this entire legacy block and the legacyCaveId argument/query-key
  // field/caller when the coordinated backend deployment is complete.
  // The old API silently ignores entranceId/networkId and returns the GLOBAL
  // catalogue with caveId fields. Never display that unfiltered response.
  // Detect its legacy representation, then request the cave-filtered page.
  // Do not fall back on HTTP errors: a future API may reject an invalid target.
  if (result.points.some(point => 'caveId' in point)) {
    if (legacyCaveId == null)
      throw new Error('Missing legacy cave association');
    const legacy = await apiGet(
      `${pointsUrl}?caveId=${encodeURIComponent(legacyCaveId)}&${pagination}`
    );
    if (
      legacy.points.some(point => String(point.caveId) !== String(legacyCaveId))
    ) {
      throw new Error('Unexpected point association');
    }
    return legacy;
  }

  const association = networkId != null ? 'network' : 'entrance';
  if (
    result.points.some(point => String(point[association]?.id) !== String(id))
  ) {
    throw new Error('Unexpected point association');
  }
  return result;
};

export const useAssociatedPoints = ({
  entranceId = null,
  networkId = null,
  legacyCaveId = null,
  page = 1,
  size = 20,
  enabled = true
}) => {
  const criteria = { entranceId, networkId, legacyCaveId, page, size };
  return useQuery({
    queryKey: pointKeys.associated(criteria),
    queryFn: () => fetchAssociatedPoints(criteria),
    enabled: enabled && (entranceId != null || networkId != null),
    staleTime: STALE.VOLATILE,
    meta: { errorPresentation: 'inline' }
  });
};

export const usePoint = id =>
  useQuery({
    queryKey: pointKeys.detail(id),
    queryFn: () => apiGet(pointUrl(id)),
    enabled: id != null && id !== '',
    staleTime: STALE.STANDARD
  });

// Product limitation: a point is expected to appear on at most 100 documents.
// Read only the first API page, capped at 100; deliberately no pagination or
// requests for subsequent pages. Revisit this limit if that assumption changes.
// Point details embed only 20 positions, so use this when that preview is partial.
export const usePointPositions = (id, { enabled = true } = {}) =>
  useQuery({
    queryKey: pointKeys.positions(id),
    queryFn: () => apiGet(`${pointPositionsUrl(id)}?page=1&size=100`),
    enabled: enabled && id != null && id !== '',
    staleTime: STALE.STANDARD,
    meta: { errorPresentation: 'inline' }
  });

export const useSurfacePointCoordinates = ({ enabled }) =>
  useQuery({
    queryKey: pointKeys.coordinates(),
    queryFn: ({ signal }) =>
      apiGet(`${getMapPointsCoordinatesUrl}?underground=false`, { signal }),
    select: selectSurfacePointCoordinates,
    meta: { errorMessageId: 'points.fetchError' },
    enabled,
    staleTime: STALE.VOLATILE
  });
