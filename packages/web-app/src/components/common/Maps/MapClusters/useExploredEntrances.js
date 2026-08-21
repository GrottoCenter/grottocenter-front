import { useMemo } from 'react';
import { usePerson } from '../../../../hooks';

/**
 * Resolves a user's explored entrances into map-ready points.
 *
 * Reusable: pass any userId (logged-in user for the main map,
 * profile owner for a profile-page map). The hook only fetches
 * person data when enabled.
 *
 * Exploration is tracked per-entrance and each explored entrance already
 * carries its coordinates (API GET /cavers/:id), so no extra request is
 * needed to place the points.
 *
 * @param {object}      params
 * @param {number|null} params.userId  - ID of the caver whose explorations to show.
 * @param {boolean}     params.enabled - Whether the overlay is active.
 * @returns {{ points: Array, hasExploredData: boolean|null }}
 */
const useExploredEntrances = ({ userId, enabled = true }) => {
  const { data: person } = usePerson(enabled ? userId : undefined);
  const isReady = Boolean(person) && person?.id === userId;

  const points = useMemo(() => {
    if (!isReady) return [];
    return (person.exploredEntrances ?? [])
      .filter(e => Number.isFinite(e.latitude) && Number.isFinite(e.longitude))
      .map(e => ({
        id: `e-${e.id}`,
        latitude: e.latitude,
        longitude: e.longitude,
        name: e.name,
        url: `/ui/entrances/${e.id}`
      }));
  }, [isReady, person]);

  const hasExploredData = isReady
    ? (person.exploredEntrances?.length ?? 0) > 0
    : null;

  return { points, hasExploredData };
};

export default useExploredEntrances;
