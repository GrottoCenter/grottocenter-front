import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPerson } from '../../../../actions/Person/GetPerson';

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
const useExploredCaves = ({ userId, enabled = true }) => {
  const dispatch = useDispatch();
  const { person, isFetching, error } = useSelector(state => state.person);

  // Guard against stale person from another profile page sharing the same reducer.
  const isPersonCurrent = Boolean(userId) && person?.id === userId;

  // Fetch person when the overlay is activated and person isn't already loaded.
  useEffect(() => {
    if (enabled && userId && !isPersonCurrent && !isFetching && !error) {
      dispatch(fetchPerson(userId));
    }
  }, [enabled, userId, isPersonCurrent, isFetching, error, dispatch]);

  const points = useMemo(() => {
    if (!isPersonCurrent) return [];

    return (person.exploredEntrances ?? [])
      .filter(e => Number.isFinite(e.latitude) && Number.isFinite(e.longitude))
      .map(e => ({
        id: `e-${e.id}`,
        latitude: e.latitude,
        longitude: e.longitude,
        name: e.name,
        url: `/ui/entrances/${e.id}`
      }));
  }, [isPersonCurrent, person]);

  const hasExploredData = isPersonCurrent
    ? (person.exploredEntrances?.length ?? 0) > 0
    : null;

  return { points, hasExploredData };
};

export default useExploredCaves;
