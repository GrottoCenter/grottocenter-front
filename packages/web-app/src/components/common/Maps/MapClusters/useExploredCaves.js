import { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPerson } from '../../../../actions/Person/GetPerson';
import { getCaveUrl } from '../../../../conf/apiRoutes';

// Module-level cache so results survive toggle on/off and component remounts.
// Map<caveId, Array<{ id, latitude, longitude, name }>>
// An empty array means "fetched but all entrances have masked coordinates".
const networkEntrancesCache = new Map();

/**
 * Resolves a user's explored caves into map-ready points.
 *
 * Reusable: pass any userId (logged-in user for the main map,
 * profile owner for a profile-page map). The hook only fetches
 * person data when enabled.
 *
 * For single-entrance caves (exploredEntrances): one badge per entrance.
 * For multi-entrance networks (exploredNetworks): one badge per entrance of
 * the network, resolved via GET /caves/:id (API returns entrance IDs only in
 * the explored-networks payload).
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

  // networkEntrances: { [caveId]: Array<{ id, latitude, longitude, name }> }
  const [networkEntrances, setNetworkEntrances] = useState({});
  const abortRef = useRef(null);

  // Fetch person when the overlay is activated and person isn't already loaded.
  useEffect(() => {
    if (enabled && userId && !isPersonCurrent && !isFetching && !error) {
      dispatch(fetchPerson(userId));
    }
  }, [enabled, userId, isPersonCurrent, isFetching, error, dispatch]);

  // Resolve network entrances via GET /caves/:id.
  // API returns entrances as ID-only in the explored-networks payload, so we
  // need the full cave to get each entrance's coordinates.
  // Results are cached module-level to avoid refetching on toggle.
  useEffect(() => {
    if (!enabled || !isPersonCurrent) return;
    const networks = person?.exploredNetworks ?? [];
    if (networks.length === 0) return;

    const unresolved = networks.filter(n => !networkEntrancesCache.has(n.id));

    if (unresolved.length === 0) {
      setNetworkEntrances(
        Object.fromEntries(networks.map(n => [n.id, networkEntrancesCache.get(n.id)]))
      );
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchOne = n =>
      fetch(`${getCaveUrl}${n.id}`, { signal: controller.signal })
        .then(r => r.json())
        .then(cave => {
          const entrances = (cave.entrances ?? [])
            .filter(e => Number.isFinite(e.latitude) && Number.isFinite(e.longitude))
            .map(e => ({ id: e.id, latitude: e.latitude, longitude: e.longitude, name: n.name }));
          networkEntrancesCache.set(n.id, entrances);
        })
        .catch(err => {
          // Don't cache abort errors — let the next enable attempt retry.
          if (err.name !== 'AbortError') networkEntrancesCache.set(n.id, []);
        });

    const fetchBatched = async () => {
      const BATCH = 3;
      for (let i = 0; i < unresolved.length; i += BATCH) {
        if (controller.signal.aborted) break;
        // eslint-disable-next-line no-await-in-loop
        await Promise.allSettled(unresolved.slice(i, i + BATCH).map(fetchOne));
        if (!controller.signal.aborted) {
          setNetworkEntrances(
            Object.fromEntries(
              networks
                .filter(n => networkEntrancesCache.has(n.id))
                .map(n => [n.id, networkEntrancesCache.get(n.id)])
            )
          );
        }
      }
    };

    fetchBatched();

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
        url: `/ui/entrances/${e.id}`,
        isNetwork: false
      }));

    const networkPoints = (person.exploredNetworks ?? []).flatMap(n =>
      (networkEntrances[n.id] ?? []).map(e => ({
        id: `ne-${e.id}`,
        latitude: e.latitude,
        longitude: e.longitude,
        name: e.name,
        url: `/ui/entrances/${e.id}`,
        isNetwork: true
      }))
    );

    return [...entrancePoints, ...networkPoints];
  }, [isPersonCurrent, person, networkEntrances]);

  const hasExploredData = isPersonCurrent
    ? (person.exploredEntrances?.length ?? 0) +
        (person.exploredNetworks?.length ?? 0) >
      0
    : null;

  return { points, hasExploredData };
};

export default useExploredCaves;
