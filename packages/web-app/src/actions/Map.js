import { isClientError } from '@/utils/httpErrors';
import {
  getMapCavesUrl,
  getMapCavesCoordinatesUrl,
  getMapEntrancesUrl,
  getMapEntrancesCoordinatesUrl,
  getMapGrottosUrl,
  getMapMassifsUrl,
  getMapMassifsCoordinatesUrl
} from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';
import {
  fetchForBounds,
  refetchVisibleTiles,
  registerEntity
} from '../utils/mapTileCache';
import { makeUrl } from './utils';

export const FETCH_MAP_START_LOADING = 'FETCH_MAP_START_LOADING';
export const FETCH_MAP_END_LOADING = 'FETCH_MAP_END_LOADING';
export const FETCH_MAP_NETWORKS_SUCCESS = 'FETCH_MAP_NETWORKS_SUCCESS';
export const FETCH_MAP_NETWORKS_FAILURE = 'FETCH_MAP_NETWORKS_FAILURE';
export const FETCH_MAP_NETWORKS_COORDINATES_SUCCESS =
  'FETCH_MAP_NETWORKS_COORDINATES_SUCCESS';
export const FETCH_MAP_NETWORKS_COORDINATES_FAILURE =
  'FETCH_MAP_NETWORKS_COORDINATES_FAILURE';
export const FETCH_MAP_ENTRANCES_SUCCESS = 'FETCH_MAP_ENTRANCES_SUCCESS';
export const FETCH_MAP_ENTRANCES_FAILURE = 'FETCH_MAP_ENTRANCES_FAILURE';
export const FETCH_MAP_ENTRANCES_COORDINATES_SUCCESS =
  'FETCH_MAP_ENTRANCES_COORDINATES_SUCCESS';
export const FETCH_MAP_ENTRANCES_COORDINATES_FAILURE =
  'FETCH_MAP_ENTRANCES_COORDINATES_FAILURE';
export const FETCH_MAP_ORGANIZATIONS_SUCCESS =
  'FETCH_MAP_ORGANIZATIONS_SUCCESS';
export const FETCH_MAP_ORGANIZATIONS_FAILURE =
  'FETCH_MAP_ORGANIZATIONS_FAILURE';
export const FETCH_MAP_ORGANIZATIONS_COORDINATES_SUCCESS =
  'FETCH_MAP_ORGANIZATIONS_COORDINATES_SUCCESS';
export const FETCH_MAP_ORGANIZATIONS_COORDINATES_FAILURE =
  'FETCH_MAP_ORGANIZATIONS_COORDINATES_FAILURE';
export const FETCH_MAP_MASSIFS_SUCCESS = 'FETCH_MAP_MASSIFS_SUCCESS';
export const FETCH_MAP_MASSIFS_FAILURE = 'FETCH_MAP_MASSIFS_FAILURE';
export const FETCH_MAP_MASSIFS_COORDINATES_SUCCESS =
  'FETCH_MAP_MASSIFS_COORDINATES_SUCCESS';
export const FETCH_MAP_MASSIFS_COORDINATES_FAILURE =
  'FETCH_MAP_MASSIFS_COORDINATES_FAILURE';
export const LOADINGS = {
  NETWORKS: 'networks',
  NETWORKS_COORDINATES: 'networks_coordinates',
  ENTRANCES: 'entrances',
  ENTRANCES_COORDINATES: 'entrances_coordinates',
  ORGANIZATIONS: 'organizations',
  ORGANIZATIONS_COORDINATES: 'organizations_coordinates',
  MASSIFS: 'massifs',
  MASSIFS_COORDINATES: 'massifs_coordinates'
};

// Bulk coordinates are fetched once at startup with world-wide bounds. The
// supercluster-backed ClusterLayer builds a kD-tree from these points and
// queries only the visible bbox on each moveend — so the whole dataset lives
// client-side without per-pan API calls.
//
// Benchmark (2025): ~130k entrances → ~2.6 MB uncompressed, ~700 KB gzipped.
// One-time cost on page load vs. a bounded API call on every pan/zoom.

// Retries the fetch up to maxRetries times with exponential backoff (1 s, 2 s, 4 s…).
// Rejects client errors immediately and other failures after all attempts.
//
// Offline, retrying is pointless: the service worker either has a cached copy
// (and answers on the first attempt) or it doesn't, and no amount of waiting
// will bring the network back. Skipping the backoff saves 7 s of dead time
// before the failure surfaces in the UI.
//
// Only transient failures retry: no-response errors (network/offline mid-call)
// and 5xx. A 4xx is a deterministic server answer — replaying it will not
// change it, and on 429 the extra calls make the rate-limit bucket worse.
// With 4 bulk coordinate endpoints each previously retrying 3 times, a single
// rate-limited map load could emit up to 16 requests against the same IP
// bucket (grottocenter-api#1848); the 4xx short-circuit caps it at 4.
const fetchWithRetry = (url, maxRetries = 3) => {
  const attempts =
    typeof navigator !== 'undefined' && navigator.onLine === false
      ? 0
      : maxRetries;
  const attempt = (retriesLeft, delay) =>
    fetch(url)
      .then(response => {
        if (response.status >= 400) {
          // Carry the HTTP status on the error so the retry filter can read a
          // number instead of parsing error.message.
          const error = new Error(String(response.status));
          error.status = response.status;
          throw error;
        }
        return response.text();
      })
      .catch(error => {
        if (retriesLeft === 0 || isClientError(error)) throw error;
        return new Promise(resolve => {
          setTimeout(resolve, delay);
        }).then(() => attempt(retriesLeft - 1, delay * 2));
      });
  return attempt(attempts, 1000);
};

const MAX_BOUNDS = {
  sw_lat: -90,
  sw_lng: -180,
  ne_lat: 90,
  ne_lng: 180
};

export const fetchAllNetworksCoordinates = () => dispatch => {
  dispatch({
    type: FETCH_MAP_START_LOADING,
    key: LOADINGS.NETWORKS_COORDINATES
  });
  return fetchWithRetry(makeUrl(getMapCavesCoordinatesUrl, MAX_BOUNDS))
    .then(text => {
      dispatch({
        type: FETCH_MAP_NETWORKS_COORDINATES_SUCCESS,
        data: JSON.parse(text)
      });
    })
    .catch(error => {
      dispatch({
        type: FETCH_MAP_NETWORKS_COORDINATES_FAILURE,
        error: makeErrorMessage(
          error.message,
          `Fetching all networks coordinates`
        )
      });
    })
    .finally(() => {
      dispatch({
        type: FETCH_MAP_END_LOADING,
        key: LOADINGS.NETWORKS_COORDINATES
      });
    });
};

// Bounds-based thunks now go through the tile cache (utils/mapTileCache.js).
// The cache handles per-tile dedup, TTL/SWR freshness, and coalesced dispatches,
// so `redux-debounced` is no longer needed here — the request rate is bounded
// by the tile grid.
registerEntity('networks', {
  url: getMapCavesUrl,
  successType: FETCH_MAP_NETWORKS_SUCCESS,
  failureType: FETCH_MAP_NETWORKS_FAILURE,
  label: 'networks'
});

export const fetchNetworks = criteria => dispatch =>
  fetchForBounds('networks', criteria, criteria.zoom, dispatch);

export const fetchAllEntrancesCoordinates = () => dispatch => {
  dispatch({
    type: FETCH_MAP_START_LOADING,
    key: LOADINGS.ENTRANCES_COORDINATES
  });
  const legacyUrl = makeUrl(getMapEntrancesCoordinatesUrl, MAX_BOUNDS);
  // A different URL separates old pairs from enriched tuples in both HTTP
  // and service-worker caches, without purging other layers or massif maps.
  const criteriaUrl = makeUrl(getMapEntrancesCoordinatesUrl, {
    ...MAX_BOUNDS,
    criteriaVersion: 1
  });
  return fetchWithRetry(criteriaUrl)
    .catch(error => {
      // Before the first online visit after upgrading, only the old URL may
      // be cached. Keep those coordinates usable offline; the filter UI checks
      // their shape and explains why low-zoom filters need an update.
      if (typeof navigator !== 'undefined' && navigator.onLine === false)
        return fetchWithRetry(legacyUrl);
      throw error;
    })
    .then(text => {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid entrance coordinates');
      dispatch({
        type: FETCH_MAP_ENTRANCES_COORDINATES_SUCCESS,
        data
      });
    })
    .catch(error => {
      dispatch({
        type: FETCH_MAP_ENTRANCES_COORDINATES_FAILURE,
        error: makeErrorMessage(
          error.message,
          `Fetching all entrances coordinates`
        )
      });
    })
    .finally(() => {
      dispatch({
        type: FETCH_MAP_END_LOADING,
        key: LOADINGS.ENTRANCES_COORDINATES
      });
    });
};

registerEntity('entrances', {
  url: getMapEntrancesUrl,
  successType: FETCH_MAP_ENTRANCES_SUCCESS,
  failureType: FETCH_MAP_ENTRANCES_FAILURE,
  label: 'entrances'
});

export const fetchEntrances = criteria => dispatch =>
  fetchForBounds('entrances', criteria, criteria.zoom, dispatch);

registerEntity('organizations', {
  url: getMapGrottosUrl,
  successType: FETCH_MAP_ORGANIZATIONS_SUCCESS,
  failureType: FETCH_MAP_ORGANIZATIONS_FAILURE,
  label: 'organizations'
});

export const fetchOrganizations = criteria => dispatch =>
  fetchForBounds('organizations', criteria, criteria.zoom, dispatch);

// The three bounds-based entities, retried together. Not a thunk: the tile
// cache holds its own dispatch reference from the last fetchForBounds call.
export const refetchMapViewport = () => {
  refetchVisibleTiles('entrances');
  refetchVisibleTiles('networks');
  refetchVisibleTiles('organizations');
};

// No dedicated /geoloc/organizationsCoordinates endpoint exists, so we hit the
// normal organizations endpoint with world-wide bounds and strip everything
// but [longitude, latitude] client-side before storing. Organizations are few
// enough (~thousands, not 100k+) that the one-shot fetch is fine.
export const fetchAllOrganizationsCoordinates = () => dispatch => {
  dispatch({
    type: FETCH_MAP_START_LOADING,
    key: LOADINGS.ORGANIZATIONS_COORDINATES
  });
  return fetchWithRetry(makeUrl(getMapGrottosUrl, MAX_BOUNDS))
    .then(text => {
      const parsed = JSON.parse(text);
      const coords = Array.isArray(parsed)
        ? parsed
            .filter(o => o.longitude != null && o.latitude != null)
            .map(o => [o.longitude, o.latitude])
        : [];
      dispatch({
        type: FETCH_MAP_ORGANIZATIONS_COORDINATES_SUCCESS,
        data: coords
      });
    })
    .catch(error => {
      dispatch({
        type: FETCH_MAP_ORGANIZATIONS_COORDINATES_FAILURE,
        error: makeErrorMessage(
          error.message,
          `Fetching all organizations coordinates`
        )
      });
    })
    .finally(() => {
      dispatch({
        type: FETCH_MAP_END_LOADING,
        key: LOADINGS.ORGANIZATIONS_COORDINATES
      });
    });
};

export const fetchAllMassifsCoordinates = () => dispatch => {
  dispatch({
    type: FETCH_MAP_START_LOADING,
    key: LOADINGS.MASSIFS_COORDINATES
  });
  return fetchWithRetry(makeUrl(getMapMassifsCoordinatesUrl, MAX_BOUNDS))
    .then(text => {
      dispatch({
        type: FETCH_MAP_MASSIFS_COORDINATES_SUCCESS,
        data: JSON.parse(text)
      });
    })
    .catch(error => {
      dispatch({
        type: FETCH_MAP_MASSIFS_COORDINATES_FAILURE,
        error: makeErrorMessage(
          error.message,
          `Fetching all massifs coordinates`
        )
      });
    })
    .finally(() => {
      dispatch({
        type: FETCH_MAP_END_LOADING,
        key: LOADINGS.MASSIFS_COORDINATES
      });
    });
};

// Unlike the tile-cached thunks above, massif polygons aren't tile-cached
// (registerEntity/fetchForBounds isn't used here), so nothing bounds the request
// rate: unthrottled, this fires on every moveend at polygon zoom. The 500 ms
// debounce that used to ride on this thunk as `redux-debounced` metadata now
// lives at its single dispatch site — see MASSIFS_DEBOUNCE_MS in pages/Map.jsx.
//
// Not tile-cached on purpose, and not an oversight: the API selects massifs with
// ST_Intersects and returns each polygon whole, so a polygon comes back in full
// from every tile it overlaps. Caching per tile would store the same geometry
// once per tile — measured at ~15x for one Alpine viewport (11 massifs, 105 kB
// of payload becoming ~1.6 MB of cache), because a polygon spans many tiles
// where a point belongs to exactly one.
export const fetchMassifs = criteria => dispatch => {
  dispatch({ type: FETCH_MAP_START_LOADING, key: LOADINGS.MASSIFS });
  const completedUrl = makeUrl(getMapMassifsUrl, criteria);
  return fetch(completedUrl)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then(text => {
      dispatch({ type: FETCH_MAP_MASSIFS_SUCCESS, data: JSON.parse(text) });
    })
    .catch(error => {
      dispatch({
        type: FETCH_MAP_MASSIFS_FAILURE,
        error: makeErrorMessage(error.message, `Fetching massifs`)
      });
    })
    .finally(() => {
      dispatch({
        type: FETCH_MAP_END_LOADING,
        key: LOADINGS.MASSIFS
      });
    });
};
