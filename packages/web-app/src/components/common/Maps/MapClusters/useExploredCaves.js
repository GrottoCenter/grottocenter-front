import { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPerson } from '../../../../actions/Person/GetPerson';
import { getCaveUrl } from '../../../../conf/apiRoutes';

// Module-level cache so centroids survive toggle on/off and component remounts.
// Map<caveId, { latitude, longitude } | null>
const centroidCache = new Map();

/**
 * Resolves a user's explored caves into map-ready points.
 *
 * Reusable: pass any userId (logged-in user for the main map,
 * profile owner for a profile-page map). The hook only fetches
 * person data when enabled.
 *
 * @param {object} params
 * @param {number|null} params.userId  - ID of the caver whose explorations to show.
 * @param {boolean}     params.enabled - Whether the overlay is active.
 * @returns {{ points: Array, hasExploredData: boolean|null }}
 *   points:          map-ready markers (empty when disabled or not yet loaded).
 *   hasExploredData: true/false when person is loaded, null while loading.
 */
const useExploredCaves = ({ userId, enabled = true }) => {
  const dispatch = useDispatch();
  const { person, isFetching, error } = useSelector(state => state.person);

  // Guard against stale person from another profile page sharing the same reducer.
  const isPersonCurrent = Boolean(userId) && person?.id === userId;

  // centroids: { [caveId]: { latitude, longitude } | null }
  const [centroids, setCentroids] = useState({});
  const abortRef = useRef(null);

  // Fetch person when the overlay is activated and person isn't already loaded.
  useEffect(() => {
    if (enabled && userId && !isPersonCurrent && !isFetching && !error) {
      dispatch(fetchPerson(userId));
    }
  }, [enabled, userId, isPersonCurrent, isFetching, error, dispatch]);

  // Resolve network centroids via GET /caves/:id (API does not expose entrance
  // coordinates inside the explored-networks payload — entrances are ID-only there).
  // Results are cached module-level to avoid refetching on toggle.
  useEffect(() => {
    if (!enabled || !isPersonCurrent) return;
    const networks = person?.exploredNetworks ?? [];
    if (networks.length === 0) return;

    const unresolved = networks.filter(n => !centroidCache.has(n.id));

    if (unresolved.length === 0) {
      setCentroids(
        Object.fromEntries(networks.map(n => [n.id, centroidCache.get(n.id)]))
      );
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    Promise.allSettled(
      unresolved.map(n =>
        fetch(`${getCaveUrl}${n.id}`, { signal: controller.signal })
          .then(r => r.json())
          .then(cave => {
            const coords = (cave.entrances ?? []).filter(
              e => Number.isFinite(e.latitude) && Number.isFinite(e.longitude)
            );
            centroidCache.set(
              n.id,
              coords.length > 0
                ? {
                    latitude:
                      coords.reduce((s, e) => s + e.latitude, 0) / coords.length,
                    longitude:
                      coords.reduce((s, e) => s + e.longitude, 0) / coords.length
                  }
                : null
            );
          })
          .catch(err => {
            // Don't cache abort errors — let the next enable attempt retry.
            if (err.name !== 'AbortError') centroidCache.set(n.id, null);
          })
      )
    ).then(() => {
      if (controller.signal.aborted) return;
      setCentroids(
        Object.fromEntries(
          networks
            .filter(n => centroidCache.has(n.id))
            .map(n => [n.id, centroidCache.get(n.id)])
        )
      );
    });

    // eslint-disable-next-line consistent-return
    return () => {
      controller.abort();
    };
  }, [enabled, isPersonCurrent, person]);

  const points = useMemo(() => {
    if (!isPersonCurrent) return [];

    const entrancePoints = (person.exploredEntrances ?? [])
      .filter(e => Number.isFinite(e.latitude) && Number.isFinite(e.longitude))
      .map(e => ({
        id: `e-${e.id}`,
        latitude: e.latitude,
        longitude: e.longitude,
        name: e.name,
        isNetwork: false
      }));

    const networkPoints = (person.exploredNetworks ?? [])
      .filter(n => centroids[n.id] != null)
      .map(n => ({
        id: `n-${n.id}`,
        latitude: centroids[n.id].latitude,
        longitude: centroids[n.id].longitude,
        name: n.name,
        isNetwork: true
      }));

    return [...entrancePoints, ...networkPoints];
  }, [isPersonCurrent, person, centroids]);

  const hasExploredData = isPersonCurrent
    ? (person.exploredEntrances?.length ?? 0) +
        (person.exploredNetworks?.length ?? 0) >
      0
    : null;

  return { points, hasExploredData };
};

export default useExploredCaves;
