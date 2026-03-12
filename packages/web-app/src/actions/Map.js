import fetch from 'isomorphic-fetch';
import {
  getMapCavesUrl,
  getMapCavesCoordinatesUrl,
  getMapEntrancesUrl,
  getMapEntrancesCoordinatesUrl,
  getMapGrottosUrl
} from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';
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
export const LOADINGS = {
  NETWORKS: 'networks',
  NETWORKS_COORDINATES: 'networks_coordinates',
  ENTRANCES: 'entrances',
  ENTRANCES_COORDINATES: 'entrances_coordinates',
  ORGANIZATIONS: 'organizations'
};

// Heatmap coordinates are fetched once at startup with world-wide bounds rather than
// on every moveend. The @asymmetrik/leaflet-d3 hexbin layer filters points client-side,
// so it only renders hexagons visible in the current viewport regardless of dataset size.
//
// Benchmark (2025): ~130k entrances → ~2.6 MB uncompressed, ~700 KB gzipped.
// One-time cost on page load vs. a bounded API call on every pan/zoom

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
        return new Promise(resolve => setTimeout(resolve, delay)).then(() =>
          attempt(retriesLeft - 1, delay * 2)
        );
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

export const fetchNetworks = criteria => {
  const thunkToDebounce = function (dispatch) {
    dispatch({ type: FETCH_MAP_START_LOADING, key: LOADINGS.NETWORKS });
    const completedUrl = makeUrl(getMapCavesUrl, criteria);
    return fetch(completedUrl)
      .then(response => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then(text => {
        dispatch({ type: FETCH_MAP_NETWORKS_SUCCESS, data: JSON.parse(text) });
      })
      .catch(error => {
        dispatch({
          type: FETCH_MAP_NETWORKS_FAILURE,
          error: makeErrorMessage(error.message, `Fetching networks`)
        });
      })
      .finally(() => {
        dispatch({
          type: FETCH_MAP_END_LOADING,
          key: LOADINGS.NETWORKS
        });
      });
  };

  thunkToDebounce.meta = {
    debounce: {
      time: 500,
      key: 'FETCH_MAP_NETWORKS'
    }
  };

  return thunkToDebounce;
};

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

export const fetchEntrances = criteria => {
  const thunkToDebounce = function (dispatch) {
    dispatch({ type: FETCH_MAP_START_LOADING, key: LOADINGS.ENTRANCES });
    const completedUrl = makeUrl(getMapEntrancesUrl, criteria);
    return fetch(completedUrl)
      .then(response => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then(text => {
        dispatch({ type: FETCH_MAP_ENTRANCES_SUCCESS, data: JSON.parse(text) });
      })
      .catch(error => {
        dispatch({
          type: FETCH_MAP_ENTRANCES_FAILURE,
          error: makeErrorMessage(error.message, `Fetching entrances`)
        });
      })
      .finally(() => {
        dispatch({
          type: FETCH_MAP_END_LOADING,
          key: LOADINGS.ENTRANCES
        });
      });
  };

  thunkToDebounce.meta = {
    debounce: {
      time: 500,
      key: 'FETCH_MAP_ENTRANCES'
    }
  };

  return thunkToDebounce;
};

export const fetchOrganizations = criteria => {
  const thunkToDebounce = function (dispatch) {
    dispatch({ type: FETCH_MAP_START_LOADING, key: LOADINGS.ORGANIZATIONS });
    const completedUrl = makeUrl(getMapGrottosUrl, criteria);
    return fetch(completedUrl)
      .then(response => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then(text => {
        dispatch({
          type: FETCH_MAP_ORGANIZATIONS_SUCCESS,
          data: JSON.parse(text)
        });
      })
      .catch(error => {
        dispatch({
          type: FETCH_MAP_ORGANIZATIONS_FAILURE,
          error: makeErrorMessage(error.message, `Fetching organizations`)
        });
      })
      .finally(() => {
        dispatch({
          type: FETCH_MAP_END_LOADING,
          key: LOADINGS.ORGANIZATIONS
        });
      });
  };

  thunkToDebounce.meta = {
    debounce: {
      time: 500,
      key: 'FETCH_MAP_ORGANIZATIONS'
    }
  };

  return thunkToDebounce;
};
