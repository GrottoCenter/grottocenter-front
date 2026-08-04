import fetch from 'isomorphic-fetch';
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
import { fetchForBounds, registerEntity } from '../utils/mapTileCache';
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
// Rejects only after all attempts are exhausted.
const fetchWithRetry = (url, maxRetries = 3) => {
  const attempt = (retriesLeft, delay) =>
    fetch(url)
      .then(response => {
        if (response.status >= 400) throw new Error(response.status);
        return response.text();
      })
      .catch(error => {
        if (retriesLeft === 0) throw error;
        return new Promise(resolve => {
          setTimeout(resolve, delay);
        }).then(() => attempt(retriesLeft - 1, delay * 2));
      });
  return attempt(maxRetries, 1000);
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
  return fetchWithRetry(makeUrl(getMapEntrancesCoordinatesUrl, MAX_BOUNDS))
    .then(text => {
      dispatch({
        type: FETCH_MAP_ENTRANCES_COORDINATES_SUCCESS,
        data: JSON.parse(text)
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
// (registerEntity/fetchForBounds isn't used here), so the request rate isn't
// bounded by the tile grid and `redux-debounced` is intentionally kept to
// avoid firing on every moveend at polygon zoom.
export const fetchMassifs = criteria => {
  const thunkToDebounce = function (dispatch) {
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

  thunkToDebounce.meta = {
    debounce: {
      time: 500,
      key: 'FETCH_MAP_MASSIFS'
    }
  };

  return thunkToDebounce;
};
