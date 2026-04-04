import fetch from 'isomorphic-fetch';
import { getEntranceUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const FETCH_ENTRANCE_SUCCESS = 'FETCH_ENTRANCE_SUCCESS';
export const FETCH_ENTRANCE_LOADING = 'FETCH_ENTRANCE_LOADING';
export const FETCH_ENTRANCE_ERROR = 'FETCH_ENTRANCE_ERROR';

export const fetchEntrance = entranceId => (dispatch, getState) => {
  dispatch({ type: FETCH_ENTRANCE_LOADING });
  const requestOptions = {
    headers: getState().login.authorizationHeader
  };

  return fetch(getEntranceUrl + entranceId, requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(data => dispatch({ type: FETCH_ENTRANCE_SUCCESS, data }))
    .catch(error => {
      if (error.isAuthError) return;
      dispatch({ type: FETCH_ENTRANCE_ERROR, error });
    });
};
